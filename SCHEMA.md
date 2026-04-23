# 📋 데이터 스키마 가이드

이 대시보드 템플릿을 다른 채널 분석에 재사용하려면, 아래 스키마대로 데이터 파일만 교체하면 된다.

**건드리지 말아야 할 파일:** `index.html`, `css/styles.css`, `js/app.js`
**분석마다 교체할 파일:** `data.json` + CSV 5종

---

## 🔑 `data.json` 스키마

JS 코드가 필드명에 직접 의존하므로 **키 이름, 타입, nested 구조를 절대 바꾸지 말 것**. 값만 채운다.

```json
{
  "total_count": 639,

  "summary": {
    "total": 639,
    "avg_views": 574850,
    "max_views": 8642431,
    "min_views": 3564,
    "top30_avg": 3863177,
    "bot30_avg": 21206,
    "english_count": 42,
    "korean_count": 597,
    "english_avg": 100395,
    "korean_avg": 608228
  },

  "videos": [
    {
      "rank": 1,
      "id": "hp-UdyHg5YE",
      "title": "영상 제목",
      "url": "https://www.youtube.com/shorts/hp-UdyHg5YE",
      "view_count": 8642431,
      "like_count": 104927,
      "upload_date": "2025-11-12",
      "upload_month": "2025-11",
      "duration_seconds": 20,
      "content_types": ["폭로/비밀", "특정인물"],
      "is_english": false,
      "tier": "top30",
      "success_factor": "아이돌 특정 행동/일상"
    }
  ],

  "monthly_stats": [
    {
      "month": "2025-03",
      "count": 59,
      "avg_views": 1008293,
      "max_views": 5905171,
      "total_views": 59489304
    }
  ],

  "view_buckets": {
    "100만+": 102,
    "50만~100만": 80,
    "10만~50만": 200,
    "5만~10만": 90,
    "1만~5만": 120,
    "1만 미만": 47
  },

  "duration_dist": {
    "all":   { "~20s": 27, "21~30s": 329, "31~40s": 246, "41~55s": 37 },
    "top30": { "~20s": 5,  "21~30s": 15,  "31~40s": 8,   "41~55s": 2  },
    "bot30": { "~20s": 8,  "21~30s": 12,  "31~40s": 7,   "41~55s": 3  }
  },

  "content_type_stats": {
    "top30":    { "폭로/비밀": 5, "특정인물": 14, "인물반응": 3, "논란/스캔들": 4, "외모/뷰티": 4, "업계/기획사": 10, "아이돌행동/일상": 5, "비교": 2, "기타": 4 },
    "top50":    { /* 동일 키 구조 */ },
    "bottom30": { /* 동일 키 구조 */ },
    "bottom50": { /* 동일 키 구조 */ }
  },

  "title_patterns": {
    "quote_marks":   { "top30": 12, "bot30": 3 },
    "person_name":   { "top30": 15, "bot30": 5 },
    "negative_hook": { "top30": 10, "bot30": 0 },
    "english_title": { "top30": 0,  "bot30": 11 },
    "company_name":  { "top30": 8,  "bot30": 2 },
    "idol_general":  { "top30": 6,  "bot30": 4 }
  }
}
```

### 필드별 주의사항

| 필드 | 타입 | 제약 |
|---|---|---|
| `videos[].tier` | string | `top30` / `top50` / `bottom30` / `bottom50` / `mid` 중 하나 |
| `videos[].content_types` | array | 빈 배열 `[]`은 허용, `null` 금지 |
| `videos[].is_english` | boolean | 한국어 false / 영어 true |
| `videos[].upload_date` | string | `YYYY-MM-DD` 포맷 고정 |
| `videos[].upload_month` | string | `YYYY-MM` 포맷 고정 |
| `view_buckets` | object | 키 이름(`100만+` 등)은 정확히 일치시킬 것 — 차트 라벨로 직접 사용됨 |
| `duration_dist` | object | 키 `~20s` / `21~30s` / `31~40s` / `41~55s` 고정 |
| `title_patterns` | object | 6개 키 모두 필수 (없으면 `{"top30":0,"bot30":0}`) |
| `content_type_stats` | object | `top30`/`top50`/`bottom30`/`bottom50` 4개 키 모두 필수 |

---

## 📄 CSV 파일 5종

다운로드 버튼으로만 제공되므로 **컬럼 구조는 자유**. 단, 파일명은 고정.

| 파일명 | 용도 |
|---|---|
| `raw_channel_data.csv` | 원본 전체 영상 데이터 |
| `top50_analysis.csv` | 상위 50개 상세 분석 |
| `bottom50_analysis.csv` | 하위 50개 상세 분석 |
| `transformed_topic_ideas.csv` | 시의성 변환 주제 아이디어 |
| `strategy_summary.csv` | 채널 전략 요약 |

---

## 🤖 AI 툴(마누스/Claude)에게 요청할 때 템플릿

> 아래 `data.json` 스키마 그대로 출력해줘. 필드명/타입/nested 구조 절대 바꾸지 말고, 값만 새 채널 데이터로 채워.
>
> 추가로 CSV 5종(`raw_channel_data.csv`, `top50_analysis.csv`, `bottom50_analysis.csv`, `transformed_topic_ideas.csv`, `strategy_summary.csv`)도 만들어줘.
>
> [위 스키마 섹션 전체 붙여넣기]

---

## ✅ 배포 전 체크리스트

- [ ] `data.json` — `python -c "import json; json.load(open('data.json', encoding='utf-8'))"` 로 파싱 확인
- [ ] `summary.total` 값과 `len(videos)` 일치하는지
- [ ] `videos[].tier` 값이 허용된 enum인지
- [ ] CSV 5종 파일명 정확한지 (영문, 언더스코어)
- [ ] 한글 포함 시 UTF-8로 저장
- [ ] 로컬에서 `python -m http.server 8000` 띄워서 대시보드 렌더링 확인 (404, 콘솔 에러 체크)
