package kr.co.herob.board.mapper;

import java.util.List;
import kr.co.herob.board.service.DocRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/** HERO_DOC 문서 행에 대한 MyBatis 조회·저장·삭제 작업을 선언합니다. */
@Mapper
public interface DocMapper {
    /** 모든 문서 행을 조회합니다. */
    List<DocRow> selectAll();

    /** 지정 컬렉션의 문서 행만 조회합니다. */
    List<DocRow> selectByCollection(@Param("col") String col);

    /** 기존 문서 본문과 수정 시각을 갱신하고 영향받은 행 수를 반환합니다. */
    int update(@Param("col") String col, @Param("id") String id, @Param("body") String body);

    /** 새 문서 행을 추가합니다. */
    int insert(@Param("col") String col, @Param("id") String id, @Param("body") String body);

    /** 컬렉션과 문서 ID가 일치하는 문서 행을 삭제합니다. */
    int delete(@Param("col") String col, @Param("id") String id);
}
