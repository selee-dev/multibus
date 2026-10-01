package kr.co.herob.board.service;

/** MyBatis가 생성자로 채우는 HERO_DOC 테이블 한 행의 조회 모델입니다. */
public record DocRow(String col, String id, String body) {
}
