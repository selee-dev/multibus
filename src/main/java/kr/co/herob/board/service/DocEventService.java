package kr.co.herob.board.service;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/** 문서 변경을 구독 중인 브라우저에 SSE 이벤트로 전달합니다. */
@Service
public class DocEventService {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /** 새 SSE 구독자를 변경 알림 목록에 추가합니다. */
    public void add(SseEmitter emitter) {
        emitters.add(emitter);
    }

    /** 완료되거나 끊어진 SSE 구독자를 목록에서 제거합니다. */
    public void remove(SseEmitter emitter) {
        emitters.remove(emitter);
    }

    /** 연결된 모든 구독자에게 문서 새로고침 이벤트를 보냅니다. */
    public void emitRefresh() {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("refresh").data("ok"));
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }
    }
}
