/*
 * 서버(Spring) 저장소 어댑터
 *
 * 원래 app.js 는 Claude Artifact 런타임의 window.claude.use("db") / use("user") 로 공유 DB 를 썼습니다.
 * 이 파일이 같은 모양의 객체를 만들어서, app.js 를 거의 고치지 않고 Spring REST API 에 연결합니다.
 *
 *   use("user") -> { can(permission) }               GET  api/me
 *   use("db")   -> collection(name).onSnapshot(cb)    GET  api/docs  (SSE + polling fallback)
 *                  doc("컬렉션/id").set(data)         PUT  api/doc/{컬렉션}/{id}
 *                  doc("컬렉션/id").delete()          DELETE api/doc/{컬렉션}/{id}
 *
 * 서버에 연결되지 않으면(예: 파일로 직접 열기) null 을 돌려주어 app.js 가 localStorage 모드로 동작합니다.
 */
(function () {
  "use strict";
  var API = "api", POLL_MS = 5000;
  var cache = {}, last = {}, listeners = [], ready = null, timer = null, me = null, eventSource = null;

  function req(method, url, body) {
    var opt = { method: method, headers: {}, credentials: "same-origin" };
    if (body !== undefined) { opt.headers["Content-Type"] = "application/json"; opt.body = JSON.stringify(body); }
    return fetch(url, opt).then(function (r) {
      if (!r.ok) { var e = new Error("HTTP " + r.status); e.status = r.status; throw e; }
      return r.status === 204 ? null : r.json();
    });
  }

  function snapshotOf(col, q) {
    var m = cache[col] || {}, docs = Object.keys(m).map(function (id) { return { id: id, data: function () { return m[id]; } }; });
    if (q && q.field) {
      docs.sort(function (a, b) {
        var x = a.data()[q.field], y = b.data()[q.field], c = x < y ? -1 : x > y ? 1 : 0;
        return q.dir === "desc" ? -c : c;
      });
    }
    if (q && q.max) docs = docs.slice(0, q.max);
    return { docs: docs };
  }

  function notify(col) {
    listeners.forEach(function (l) { if (l.col === col) { try { l.cb(snapshotOf(col, l.q)); } catch (e) { if (window.console) console.error(e); } } });
  }

  function pull() {
    return Promise.all([req("GET", API + "/docs"), req("GET", API + "/chats/private")]).then(function (result) {
      var all = result[0], privateMessages = result[1] || [], privateDocs = {};
      Object.keys(all).forEach(function (col) {
        var s = JSON.stringify(all[col]);
        if (s !== last[col]) { last[col] = s; cache[col] = all[col]; notify(col); }
      });
      privateMessages.forEach(function (message) { if (message && message.id) privateDocs[message.id] = message; });
      var privateSnapshot = JSON.stringify(privateDocs);
      if (privateSnapshot !== last.privateChats) {
        last.privateChats = privateSnapshot;
        cache.privateChats = privateDocs;
        notify("privateChats");
      }
    });
  }

  function startPolling() {
    if (timer) return;
    timer = setInterval(function () { if (!document.hidden) pull().catch(function () {}); }, POLL_MS);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) pull().catch(function () {}); });
  }

  function startSse() {
    if (!window.EventSource) {
      startPolling();
      return;
    }
    if (eventSource) return;
    eventSource = new EventSource(API + "/events");
    eventSource.addEventListener("refresh", function () {
      pull().catch(function () {});
    });
    eventSource.addEventListener("connected", function () {
      pull().catch(function () {});
    });
    eventSource.onerror = function () {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      startPolling();
    };
  }

  function query(col, q) {
    return {
      orderBy: function (f, d) { return query(col, { field: f, dir: d || "asc", max: q && q.max }); },
      limit: function (n) { return query(col, { field: q && q.field, dir: q && q.dir, max: n }); },
      onSnapshot: function (cb) {
        var l = { col: col, cb: cb, q: q };
        listeners.push(l);
        setTimeout(function () { cb(snapshotOf(col, q)); }, 0);   // 처음 한 번은 현재 데이터를 바로 전달
        return function () { listeners = listeners.filter(function (x) { return x !== l; }); };
      }
    };
  }

  var db = {
    collection: function (col) { return query(col, null); },
    privateChatContacts: function () { return req("GET", API + "/chats/private/contacts"); },
    sendPrivateMessage: function (recipients, text) {
      return req("POST", API + "/chats/private", { recipients: recipients, text: text }).then(function (message) {
        return pull().then(function () { return message; });
      });
    },
    deleteCharacter: function (id) {
      return req("DELETE", API + "/characters/" + encodeURIComponent(id)).then(function () { return pull(); });
    },
    doc: function (path) {
      var p = path.split("/"), col = p[0], id = p[1], url = API + "/doc/" + encodeURIComponent(col) + "/" + encodeURIComponent(id);
      function after() { return pull().catch(function () {}); }
      return {
        set: function (data) { return req("PUT", url, data).then(after); },
        delete: function () { return req("DELETE", url).then(after); }
      };
    }
  };

  function connect() {
    if (!ready) {
      ready = Promise.all([req("GET", API + "/me"), req("GET", API + "/docs"), req("GET", API + "/chats/private")]).then(function (r) {
        me = r[0];
        Object.keys(r[1]).forEach(function (c) { cache[c] = r[1][c]; last[c] = JSON.stringify(r[1][c]); });
        cache.privateChats = {};
        (r[2] || []).forEach(function (message) { if (message && message.id) cache.privateChats[message.id] = message; });
        last.privateChats = JSON.stringify(cache.privateChats);
        startSse();
        return true;
      }, function () { return false; });
    }
    return ready;
  }

  window.claude = {
    use: function (name) {
      return connect().then(function (ok) {
        if (!ok) return null;
        if (name === "db") return db;
        if (name === "user") return { can: function () { return Promise.resolve(!!(me && me.canWrite)); }, info: me };
        return null;
      });
    }
  };
})();
