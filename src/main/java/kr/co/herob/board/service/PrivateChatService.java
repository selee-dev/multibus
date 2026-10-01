package kr.co.herob.board.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.TreeSet;
import java.util.UUID;
import kr.co.herob.board.mapper.DocMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 계정 간 개인·그룹 메시지를 저장하고 대화 참여자에게만 반환합니다. */
@Service
public class PrivateChatService {

    private final DocMapper mapper;
    private final AccountService accounts;
    private final ObjectMapper json;

    public PrivateChatService(DocMapper mapper, AccountService accounts, ObjectMapper json) {
        this.mapper = mapper;
        this.accounts = accounts;
        this.json = json;
    }

    /** 로그인한 사용자가 참여한 대화 메시지만 시간순으로 반환합니다. */
    @Transactional(readOnly = true)
    public List<ObjectNode> messagesFor(String username) {
        List<ObjectNode> messages = new ArrayList<>();
        for (DocRow row : mapper.selectByCollection("privateChats")) {
            try {
                JsonNode parsed = json.readTree(row.body());
                JsonNode participants = parsed.get("participants");
                if (!parsed.isObject() || participants == null || !participants.isArray()) continue;
                boolean member = false;
                for (JsonNode participant : participants) if (username.equals(participant.asText())) member = true;
                if (!member) continue;
                ObjectNode message = ((ObjectNode) parsed).deepCopy();
                message.put("id", row.id());
                messages.add(message);
            } catch (JsonProcessingException ignored) {
                // 손상된 메시지는 결과에서 제외합니다.
            }
        }
        messages.sort(Comparator.comparingLong(message -> message.path("at").asLong()));
        return messages;
    }

    /** 수신 계정들을 검증한 뒤 멤버만 읽을 수 있는 개인·그룹 메시지를 저장합니다. */
    @Transactional
    public ObjectNode send(String sender, Object rawRecipients, Object rawText) {
        if (sender == null) throw new IllegalArgumentException("로그인이 필요합니다.");
        if (!(rawRecipients instanceof List<?> recipients)) throw new IllegalArgumentException("대화 상대를 선택해 주세요.");
        if (!(rawText instanceof String text)) throw new IllegalArgumentException("메시지를 입력해 주세요.");
        text = text.trim();
        if (text.isEmpty() || text.length() > 500) throw new IllegalArgumentException("메시지는 1~500자로 입력해 주세요.");
        if (recipients.isEmpty() || recipients.size() > 20) throw new IllegalArgumentException("대화 상대는 1~20명까지 선택할 수 있습니다.");

        TreeSet<String> participants = new TreeSet<>();
        participants.add(sender.toLowerCase(Locale.ROOT));
        for (Object value : recipients) {
            if (!(value instanceof String recipient)) throw new IllegalArgumentException("대화 상대가 올바르지 않습니다.");
            String normalized = recipient.trim().toLowerCase(Locale.ROOT);
            if (!accounts.accountExists(normalized) || normalized.equals(sender)) {
                throw new IllegalArgumentException("대화 상대 계정을 확인해 주세요.");
            }
            participants.add(normalized);
        }

        String room = UUID.nameUUIDFromBytes(String.join("\n", participants).getBytes(StandardCharsets.UTF_8))
            .toString().replace("-", "");
        String id = "pm" + UUID.randomUUID().toString().replace("-", "");
        ObjectNode message = json.createObjectNode();
        message.put("room", room);
        message.put("sender", sender);
        message.put("text", text);
        message.put("at", System.currentTimeMillis());
        ArrayNode participantArray = message.putArray("participants");
        participants.forEach(participantArray::add);
        mapper.insert("privateChats", id, message.toString());
        message.put("id", id);
        return message;
    }
}