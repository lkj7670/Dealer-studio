/* 딜러리세상 작업실 — app.js
   외부 API·서버 없이 localStorage 에만 저장합니다.
   v2(2026-11-22): AI 사무실 현황(축·자동 루틴) + 보관실(아카이브) 탭 신설.
   v3(2026-11-22): 📅 주간 일정표(매일 공통 + 월~일 + 날짜 확인) 추가, 루틴 11개로 정정.
   v4(2026-11-27): 급여 앱 2종·자동 더치페이·공식 사이트 2곳·타로 자료 반영, 루틴을 가동/일시정지로 구분. */
(function () {
  'use strict';

  var KEY = 'dealer-studio-v2';
  var KEY_V1 = 'dealer-studio-v1';

  /* 화면 기준 시각 — 배포할 때마다 이 값만 고치면 배지가 바뀝니다. */
  var SYNCED_AT = '2026-11-27 05:00 KST';

  /* =========================================================
     1. 기본 데이터
     ========================================================= */

  var STAFF = [
    {
      id: 'leader', emoji: '🐹', name: '돈많은피클', role: '팀장 · 총괄 기획·검토',
      color: '#f8dcae',
      lines: [
        '오늘 할 일 3개부터 정리해요',
        '발행 전엔 저한테 먼저 보여 주세요',
        '크레딧 아끼자, 무거운 일은 모아서!'
      ]
    },
    {
      id: 'content', emoji: '🐰', name: '콘텐츠', role: '블로그 · 티스토리 글',
      color: '#dceefb',
      lines: [
        '건강검진 초안 1,462자 준비됐어요',
        'AI·피클 얘기는 빼고 썼어요',
        '첫 3줄은 장면부터 시작할게요'
      ]
    },
    {
      id: 'shorts', emoji: '🐱', name: '쇼츠', role: '유튜브 · 틱톡 영상',
      color: '#ffe3d6',
      lines: [
        '메리 셀레스트 65초 대본 대기 중',
        '자동차세 3% 경고로 시작해요',
        '선희 목소리로 입힐 준비 완료'
      ]
    },
    {
      id: 'market', emoji: '🐶', name: '마켓', role: '크리에이터샵 · 쿠팡파트너스',
      color: '#e7f5d9',
      lines: [
        'MK295 38초 시나리오 완성',
        '샵 링크는 꼭 클릭 링크로 걸어요',
        '정산 계좌는 아직 비어 있어요'
      ]
    },
    {
      id: 'campaign', emoji: '🐼', name: '체험단', role: '브랜드 커넥트 · 링블',
      color: '#eae4fa',
      lines: [
        '글로브마크·키핀 발표는 11/23',
        '더티린넨도 같은 날 발표예요',
        '주제 안 맞는 건 신청이 막혀요'
      ]
    },
    {
      id: 'asset', emoji: '🦊', name: '파이·액시스', role: '파이 코인 · 로봇 주식',
      color: '#ffe9c7',
      lines: [
        '주간 액시스 #01 발행 끝났어요',
        '파이 글로벌 #01도 올라갔어요',
        '오늘 저녁 7시 첫 보상 일정이에요'
      ]
    },
    {
      id: 'contest', emoji: '🐸', name: '공모전', role: '공모전 · 지원사업',
      color: '#d9f2e4',
      lines: [
        '사랑의열매는 서명만 남았어요',
        '표어는 20자 한 줄이면 끝!',
        '음성 블로그 공모전은 12/11 마감'
      ]
    }
  ];

  var OWNER_NAME = {};
  STAFF.forEach(function (s) { OWNER_NAME[s.id] = s.name; });

  var DEFAULT_TASKS = [
    { title: '틱톡 미스터리 「메리 셀레스트」 65초 쇼츠 제작', owner: 'shorts', stage: 'doing' },
    { title: '유튜브 「12월 자동차세, 31일 넘기면 3% 더」 쇼츠 제작', owner: 'shorts', stage: 'doing' },
    { title: '샵 홍보 쇼츠 「무소음 키보드 MK295」 38초', owner: 'market', stage: 'doing' },
    { title: '음성군 표어공모전 표어 후보 5개 작성', owner: 'contest', stage: 'doing' },
    { title: '사랑의열매 제안서 서명 넣고 온라인 접수', owner: 'contest', stage: 'doing' },
    { title: '사랑의열매 아이디어 제안서 초안 검토 (건강·돌봄)', owner: 'contest', stage: 'review' },
    { title: '티스토리 「2026년 국가건강검진」 초안 발행 승인', owner: 'content', stage: 'review' },
    { title: '글로브마크·키핀 체험단 발표 확인 (11/23)', owner: 'campaign', stage: 'review' },
    { title: '주간 액시스 #01 「경제」 카테고리로 옮길지', owner: 'asset', stage: 'review' },
    { title: '핫템 플레이스 주제별 인기템 브리핑 조사 (관별 검토용)', owner: 'market', stage: 'doing' },
    { title: '전자명함 티켓·고수수료 핫템·명함 이미지 반영본 (site.zip 대기)', owner: 'market', stage: 'review' },
    { title: "Dealer's World 1편 떡볶이 (Ava) 완성본 검토", owner: 'shorts', stage: 'review' },
    { title: '11/22 매일 콘텐츠·체험단 세트 검토 (티스토리·영상 3편·HNF)', owner: 'content', stage: 'review' },
    { title: '파이 글로벌 #01 네이버 블로그 발행', owner: 'asset', stage: 'done' },
    { title: '주간 액시스 #01 티스토리 발행 (lkj7670.tistory.com/85)', owner: 'asset', stage: 'done' },
    { title: '글로브마크·키핀 브랜드 커넥트 신청 완료', owner: 'campaign', stage: 'done' },
    { title: '물류 앱·입금대장 현장 테스트 (전표 인식·급여 입력)', owner: 'leader', stage: 'doing' },
    { title: '틱톡 판테놀 숏폼 — 내 댓글 1개 고정', owner: 'shorts', stage: 'doing' },
    { title: '티스토리 연말정산 글 발행', owner: 'content', stage: 'doing' },
    { title: '파이 해커톤 1호 재개 (11/30 09:00) — 클로드 수정본 검수부터', owner: 'contest', stage: 'review' }
  ];

  var DEFAULT_MANUAL = [
    {
      title: '브랜드 이름은 하나로',
      text: '유튜브·티스토리·네이버 블로그·브랜드 커넥트·카카오톡 채널·크리에이터샵까지 전부 「딜러리세상」(슬러그 dealerisesang)으로 통일한다.\n해외 전용 유튜브만 「Dealer\'s World」를 쓴다.'
    },
    {
      title: 'AI·피클 언급 금지',
      text: '블로그·티스토리 글에는 AI가 쓴다는 언급과 피클 소개·초대 링크를 넣지 않는다.\n(유튜브 쇼츠 설명란의 초대코드는 광준 님이 직접 시킨 예외다.)'
    },
    {
      title: '커피값 후원 블록',
      text: '글 끝에 후원 안내를 붙인다.\n신협 132103354631 / 예금주 이광준\n"이 후원금은 AI 에이전트를 활용해 더 많은 정보를 제공하는 데 쓰입니다."',
      copy: '132103354631'
    },
    {
      title: '올리기 전에 먼저 검토',
      text: '쇼츠·틱톡은 시나리오를 글로 먼저 보여 주고 승인받은 뒤 제작한다. 업로드도 승인 후에 한다.\n어려운 용어는 화면 글자로만 빼고, 대본은 쉬운 말로 쓴다.'
    },
    {
      title: '문체 — TV광고·예능 말투',
      text: '① 첫 3줄은 장면부터 시작\n② 3~6어절로 끊기\n③ 숫자는 한 화면에 하나\n④ 한 줄은 한 번만 비틀기\n⑤ 1인칭 경험 톤으로'
    },
    {
      title: '건강 글은 생활 관리 톤',
      text: '"치료·완치" 같은 표현을 쓰지 않는다. 효능을 단정하지 않고, 실제로 느낀 것만 쓴다.\n혈당·혈압·체중은 함께 보는 생활 관리 관점으로 쓴다.'
    },
    {
      title: '돈 드는 일은 먼저 확인',
      text: '선결제·선구매 구조 체험단은 하지 않는다("돈 드는 건 하지 말자").\n유료 지출·결제가 생기면 먼저 물어본다.'
    },
    {
      title: '사실 확인이 먼저',
      text: '실질 정보·논문·공식 출처를 쓴다. 확인하지 못한 것은 확인하지 못했다고 적는다.\n중간 보고나 확인 안 된 주소로 "완료"라고 단정하지 않는다.'
    }
  ];

  var DEFAULT_CONTESTS = [
    { title: '사랑의열매 배분사업 아이디어 공모전', org: '사회복지공동모금회', kind: '공모전', due: '2027-01-15', reward: '대상 200만 원 (총 600만 원)', status: '준비 중', memo: '건강·돌봄 분야에 「쉬운비서 하루」 제안. 제안서 초안 완성 — 서명 넣고 온라인 접수만 남음. A4 2매, 제공 양식 변경 금지.', url: 'https://www.chest-contest.co.kr' },
    { title: '음성군 장애인식개선 표어공모전 「다름의 가치를 잇다」', org: '음성군장애인복지관', kind: '공모전', due: '2026-12-11', reward: '대상 5만 원 · 참가상 200명 3천 원', status: '준비 중', memo: '20자 표어 한 줄 + 신청서 → ecbr@ecbr.or.kr. 응모만 하면 3천 원권은 거의 확보. 표절 없는 창작.', url: 'https://www.ecbr.or.kr/?mod=document&page_id=3824&uid=12231' },
    { title: "음성군 블로그 공모전 「음·성」", org: '음성군', kind: '공모전', due: '2026-12-11', reward: '최우수 100만 원', status: '관심', memo: '12월 쉬는 날 다녀와서 쓸 것. 12/01 08:00 날짜 정하기 알림 등록됨.' },
    { title: '「내가 만난 원자력」 체험수기 공모전', org: '한국원자력문화재단', kind: '공모전', due: '2026-11-30', reward: '20명 × 30만 원', status: '관심', memo: '체험수기 — 직접 겪은 일이 있어야 해서 보류 중.' },
    { title: '제4회 강원랜드 환경영상 공모전', org: '강원랜드', kind: '공모전', due: '2026-11-24', reward: '총 800만 원', status: '제외', memo: 'AI 생성 제외·직접 촬영 조건. 일정상 이번엔 어렵다.' },
    { title: '국가유산 겨울 계절배너 사진·글귀', org: '국가유산청', kind: '공모전', due: '2026-11-30', reward: '5만 원 기프티콘', status: '관심', memo: '직접 찍은 겨울 사진 + 짧은 글귀.' },
    { title: '글로브마크 (여행 기록 앱)', org: '네이버 브랜드 커넥트', kind: '체험단', due: '2026-11-23', reward: '평생이용권 29,900원', status: '신청 완료', memo: '발표 11/23. 여행 축 블로그 1편 + 구글플레이 별점 캡처. 필수 키워드: 여행 일정 가계부 / 글로브마크 / 비주얼라이저.', url: 'https://brandconnect.naver.com/1018145414336544/campaign/1017916697947842/info' },
    { title: '키핀 (링크·캡처 보관 앱)', org: '네이버 브랜드 커넥트', kind: '체험단', due: '2026-11-23', reward: '평생이용권 29,900원', status: '신청 완료', memo: '발표 11/23. IT테크 축 — 글로브마크와 글 소재를 나눠 쓴다(링크 정리).', url: 'https://brandconnect.naver.com/1018145414336544/campaign/1017874315288448/info' },
    { title: '더티린넨 탈취제', org: '네이버 브랜드 커넥트', kind: '체험단', due: '2026-11-23', reward: '현금 50,000원', status: '발표 대기', memo: '11/23 11:00 발표 확인 알림 등록됨.' },
    { title: '관절 (브랜드 커넥트)', org: '네이버 브랜드 커넥트', kind: '체험단', due: '', reward: '', status: '발표 대기', memo: '11/17~18 신청분 — 선정 대기 4건 중 하나. 발표일 미정.' },
    { title: '퍼그제로 (브랜드 커넥트)', org: '네이버 브랜드 커넥트', kind: '체험단', due: '', reward: '', status: '발표 대기', memo: '11/17~18 신청분 — 선정 대기. 발표일 미정.' },
    { title: '여행용 백팩 (브랜드 커넥트)', org: '네이버 브랜드 커넥트', kind: '체험단', due: '', reward: '', status: '발표 대기', memo: '11/17~18 신청분 — 선정 대기. 발표일 미정.' },
    { title: '윗클 소취 세정티슈 70매', org: '네이버 브랜드 커넥트', kind: '체험단', due: '2026-11-22', dueLabel: '모집 마감', reward: '상품 15,000원', status: '제외', memo: '캠페인 주제가 동물/펫 — 우리 스페이스 주제(푸드·여행·생활건강)와 달라 신청이 막힘.' },
    { title: '섬백리향 플로럴 향수 (링블 #286553)', org: '링블', kind: '체험단', due: '2026-11-27', reward: '향수 1개', status: '신청 완료', memo: '11/27 11:00 발표 확인.' },
    { title: 'AnimalBar (링블 #286543)', org: '링블', kind: '체험단', due: '2026-11-27', reward: '제품 1개', status: '신청 완료', memo: '11/27 11:00 발표 확인.' },
    { title: '브리오 알티지 오메가3 (링블)', org: '링블', kind: '체험단', due: '2026-11-23', reward: '제품 1개', status: '발표 대기', memo: '11/23 발표. 효능 단정 없이 후기.' }
  ];

  var CONTEST_STATUS = ['관심', '준비 중', '신청 완료', '발표 대기', '결과 확인', '제외'];
  var STAGES = [
    { id: 'doing', name: '진행 중' },
    { id: 'review', name: '검토 대기' },
    { id: 'done', name: '완료' }
  ];

  /* ---------- 모션 효과 ---------- */
  var FX = [
    { id: 'fade', cat: '등장', name: '페이드 인', desc: '어둠에서 서서히 떠오르는 가장 기본 등장. 차분한 오프닝에.', prompt: '화면이 검은색에서 서서히 밝아지며 제목 「딜러리세상」이 0.9초 동안 부드럽게 나타난다. 배경은 고정하고 카메라는 움직이지 않는다.', html: '<div class="d a-fade">딜러리세상</div>', cls: 'a-fade' },
    { id: 'up', cat: '등장', name: '슬라이드 업', desc: '아래에서 살짝 튕기며 올라오는 등장. 자막·제목 모두 무난.', prompt: '제목이 화면 아래 26px에서 0.8초 동안 살짝 튕기듯 올라오며 나타난다. 올라오는 동안 살짝 흐렸다가 선명해진다.', html: '<div class="d a-up">오늘의 딜러리세상</div>', cls: 'a-up' },
    { id: 'pop', cat: '등장', name: '팝 인', desc: '작았다가 톡 튀어나오는 등장. 귀여운 캐릭터·아이콘에.', prompt: '제목이 0.45배 크기에서 0.7초 동안 1.08배까지 커졌다가 제자리로 줄어들며 등장한다. 등장 순간 아주 약한 흔들림을 준다.', html: '<div class="d a-pop">딜! 나왔다</div>', cls: 'a-pop' },
    { id: 'flip', cat: '등장', name: '플립 인', desc: '아래를 축으로 젖혀졌다 펼쳐지는 등장. 카드·패널에.', prompt: '제목이 아래쪽을 축으로 85도 젖혀진 상태에서 0.9초 동안 앞으로 펼쳐지듯 등장한다. 원근감을 살린다.', html: '<div class="d a-flip">작업실 오픈</div>', cls: 'a-flip' },
    { id: 'blur', cat: '등장', name: '블러 인', desc: '흐림에서 초점이 맞는 등장. 감성·회상 장면에.', prompt: '제목이 14px 흐린 상태에서 1초 동안 초점이 맞으며 나타난다. 배경은 살짝 어둡게 유지한다.', html: '<div class="d a-blur">천천히, 또렷하게</div>', cls: 'a-blur' },
    { id: 'wipe', cat: '등장', name: '마스크 와이프', desc: '왼쪽에서 잘려 나가듯 드러나는 등장. 정보·리스트에.', prompt: '제목이 왼쪽에서 오른쪽으로 0.9초 동안 잘려 나가듯 드러난다. 글자 전체가 한 번에 나타나지 않게 한다.', html: '<div class="d a-wipe">브랜드 통일</div>', cls: 'a-wipe' },

    { id: 'fadeout', cat: '퇴장', name: '페이드 아웃', desc: '서서히 사라지는 퇴장. 장면 전환 직전에.', prompt: '제목이 1초간 그대로 있다가 0.8초 동안 서서히 사라진다. 배경은 남겨 둔다.', html: '<div class="d x-fade">잠시 후 사라져요</div>', cls: 'x-fade' },
    { id: 'downout', cat: '퇴장', name: '슬라이드 다운 아웃', desc: '아래로 내려가며 사라지는 퇴장. 다음 장면이 위에서 올 때.', prompt: '제목이 0.8초 동안 아래로 34px 내려가며 사라진다. 사라지는 동안 투명도가 함께 줄어든다.', html: '<div class="d x-down">다음 장면으로</div>', cls: 'x-down' },
    { id: 'shrink', cat: '퇴장', name: '스케일 아웃', desc: '오므라들며 사라지는 퇴장. 강조 후 정리에.', prompt: '제목이 0.8초 동안 0.3배로 줄어들며 사라진다. 중심을 기준으로 줄어든다.', html: '<div class="d x-shrink">정리하고 넘어가요</div>', cls: 'x-shrink' },
    { id: 'spinout', cat: '퇴장', name: '회전 퇴장', desc: '돌면서 작아지는 퇴장. 가벼운 전환에.', prompt: '제목이 0.8초 동안 70도 회전하며 작아지면서 사라진다. 회전축은 글자 중심이다.', html: '<div class="d x-spin">휙!</div>', cls: 'x-spin' },

    { id: 'pulse', cat: '강조', name: '펄스', desc: '콩콩 커졌다 작아지는 반복 강조. 핵심 문장 하나에만.', prompt: '제목이 1.4초 주기로 1.09배까지 커졌다 작아지기를 반복한다. 강조가 필요한 한 문장에만 쓴다.', html: '<div class="d e-pulse">오늘 마감 2건</div>', cls: 'e-pulse' },
    { id: 'shake', cat: '강조', name: '셰이크', desc: '좌우로 부르르. 경고·손해 알림에 딱.', prompt: '제목이 0.55초 동안 좌우로 7px씩 흔들린다. 경고·손해를 알리는 문장에 쓴다.', html: '<div class="d e-shake">31일 넘기면 3% 더</div>', cls: 'e-shake' },
    { id: 'bounce', cat: '강조', name: '바운스', desc: '위로 튀는 반복 강조. 숫자·혜택에.', prompt: '제목이 1.1초 주기로 위로 14px 튀어 올랐다 내려온다. 두 번째 튀는 높이는 절반으로 줄인다.', html: '<div class="d e-bounce">참가상 200명</div>', cls: 'e-bounce' },
    { id: 'mark', cat: '강조', name: '형광펜 밑줄', desc: '키워드 뒤로 노란 줄이 그어지는 강조. 자막 필수템.', prompt: '키워드 뒤로 노란 형광펜이 0.6초 동안 왼쪽에서 오른쪽으로 그어진다. 글자는 움직이지 않는다.', html: '<div class="d e-mark"><span class="mark">딜러리세상</span> 3배 빠르게</div>', cls: 'e-mark' },
    { id: 'countup', cat: '강조', name: '숫자 카운트업', desc: '0에서 목표 숫자까지 올라가는 강조. 성과·금액에.', prompt: '숫자가 0에서 12,480까지 1.2초 동안 빠르게 올라간다. 마지막 0.15초에 숫자가 한 번 커졌다 제자리로 온다.', html: '<div class="d num" data-count="12480">0<small>명</small></div>', cls: 'countup' },
    { id: 'typing', cat: '강조', name: '타이핑', desc: '한 글자씩 찍히는 강조. 검색·퀴즈·정보에.', prompt: '문장이 한 글자씩 0.06초 간격으로 타이핑되듯 나타나고, 끝에 커서가 한 번 깜빡인다.', html: '<div class="d mono" data-type="딜러리세상 작업실"></div>', cls: 'typing' },

    { id: 'slam', cat: '자막', name: '예능 자막 쾅', desc: '두꺼운 자막이 내려찍히는 예능식 강조. 쇼츠 오프닝에.', prompt: '핵심 단어가 2.6배 크기에서 0.55초 만에 "쾅" 하고 화면 중앙에 내려앉는다. 착지 순간 화면이 살짝 밝아진다.', html: '<div class="demo c-slam-wrap"><span class="cap-slam">쾅!</span></div>', cls: 'c-slam' },
    { id: 'charpop', cat: '자막', name: '한 글자씩 튀기기', desc: '글자가 하나씩 통통 튀어나오는 자막. 짧은 제목에.', prompt: '제목의 글자가 한 글자씩 0.07초 간격으로 아래에서 튀어오르며 나타난다. 마지막 글자까지 0.35초 안에 끝난다.', html: '<div class="chars"><span>딜</span><span>러</span><span>리</span><span>세</span><span>상</span></div>', cls: 'charpop' },
    { id: 'kwcolor', cat: '자막', name: '키워드 색 강조', desc: '문장은 두고 핵심 단어만 색이 바뀌는 자막. 정보 전달에.', prompt: '문장은 그대로 두고 핵심 단어만 0.35초 후 노란색으로 바뀌며 살짝 빛난다. 나머지 글자는 흰색을 유지한다.', html: '<div class="d e-kw">오늘 <span class="kw">3건</span> 마감</div>', cls: 'e-kw' },
    { id: 'lower3', cat: '자막', name: '자막 바 슬라이드', desc: '아래 띠 자막이 밀려 들어오는 자막. 설명·출처에.', prompt: '화면 아래쪽에 띠 자막이 왼쪽에서 0.7초 동안 밀려 들어온다. 띠는 오른쪽으로 갈수록 투명해진다.', html: '<div class="demo"><div class="lower3 l3">이번 주 마감 2건 · 11/23</div></div>', cls: 'l3' },

    { id: 'camin', cat: '카메라', name: '줌 인', desc: '피사체로 다가가는 카메라. 감정·집중에.', prompt: '카메라가 피사체 쪽으로 2.4초 동안 1.35배 확대된다. 확대는 처음엔 빠르고 끝으로 갈수록 느려진다.', html: '<div class="scene cam-in"><span class="sky"></span><span class="sun2"></span><span class="hill"></span><span class="tagcard">여행</span></div>', cls: 'cam-in' },
    { id: 'camout', cat: '카메라', name: '줌 아웃', desc: '당겨져 있던 카메라가 물러나는. 전체 공개에.', prompt: '1.4배로 당겨져 있던 카메라가 2.4초 동안 원래 크기로 물러난다. 전체 풍경이 드러난다.', html: '<div class="scene cam-out"><span class="sky"></span><span class="sun2"></span><span class="hill"></span><span class="tagcard">딜러리세상</span></div>', cls: 'cam-out' },
    { id: 'handheld', cat: '카메라', name: '핸드헬드 흔들림', desc: '손으로 든 듯 미세하게 흔들리는 카메라. 현장감에.', prompt: '카메라가 1.8초 동안 손으로 든 것처럼 좌우로 3px씩 미세하게 흔들린다. 피사체는 화면 가운데를 유지한다.', html: '<div class="scene cam-hand"><span class="sky"></span><span class="hill"></span><span class="tagcard">현장감</span></div>', cls: 'cam-hand' },
    { id: 'tilt', cat: '카메라', name: '틸트 회전', desc: '카메라가 기울며 다가가는. 역동적인 전환에.', prompt: '카메라가 2.2초 동안 -7도에서 +5도로 기울며 1.1배에서 1.18배로 살짝 다가간다. 시선이 한쪽으로 흐른다.', html: '<div class="scene cam-tilt"><span class="sky"></span><span class="sun2"></span><span class="hill"></span><span class="tagcard">움직임</span></div>', cls: 'cam-tilt' },

    { id: 'wipetr', cat: '전환', name: '와이프 전환', desc: '앞 장면이 잘려 나가고 다음 장면이 채워지는 전환.', prompt: '1.6초에 걸쳐 장면 A가 왼쪽부터 잘려 사라지고, 그 자리로 장면 B가 채워진다. 경계는 날카롭게 유지한다.', html: '<div class="demo"><div class="trans"><div class="p1 tr-p1">BEFORE</div><div class="p2 tr-p2">AFTER</div></div></div>', cls: 'wipetr' },
    { id: 'patches', cat: '전환', name: '조각보 채우기', desc: '칸칸이 색이 채워지는 전환. 목록·체크리스트에.', prompt: '화면이 12칸으로 나뉘어 색 조각이 0.07초 간격으로 하나씩 채워진다. 마지막 칸이 채워지면 전체가 한 번 밝아진다.', html: '<div class="demo"><div class="patches"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div>', cls: 'patches' }
  ];

  var COMBOS = [
    {
      id: 'hook',
      title: '3초 오프닝 — 후킹',
      desc: '쇼츠 첫 3초용. 카메라가 다가가고, 자막이 쾅 내려앉고, 숫자에 형광펜이 그어집니다.',
      steps: [
        { at: 0, t: '0.0초', label: '줌 인' },
        { at: 700, t: '0.7초', label: '예능 자막 쾅' },
        { at: 1500, t: '1.5초', label: '형광펜 밑줄' }
      ],
      prompt: '[3초 오프닝 타임라인]\n0.0초 — 카메라가 피사체로 1.3배 줌 인 (2.4초에 걸쳐 천천히)\n0.7초 — 핵심 단어가 2.6배에서 "쾅" 내려앉음 (0.55초)\n1.5초 — 숫자 뒤로 노란 형광펜이 왼쪽에서 그어짐 (0.6초)\n3.0초 — 장면 유지, 다음 컷으로',
      html: '<div class="demo cb cb1"><div class="cb-scene"><span class="cb-sun"></span><span class="cb-card">1872년, 빈 배</span></div><div class="cb-cap">3분?</div><div class="cb-line">사라진 <span class="mk">열 명</span></div></div>'
    },
    {
      id: 'product',
      title: '제품 소개 — 깔끔 버전',
      desc: '정보형 쇼츠용. 화면이 쓸리며 열리고, 숫자가 올라간 뒤 조용히 사라집니다.',
      steps: [
        { at: 0, t: '0.0초', label: '마스크 와이프' },
        { at: 800, t: '0.8초', label: '숫자 카운트업' },
        { at: 2200, t: '2.2초', label: '페이드 아웃' }
      ],
      prompt: '[제품 소개 타임라인]\n0.0초 — 왼쪽에서 오른쪽으로 화면이 쓸리며 제품명 등장 (0.9초)\n0.8초 — 숫자가 0에서 12,480까지 올라감 (1.2초), 마지막에 한 번 커짐\n2.2초 — 화면 전체가 0.8초 동안 서서히 사라짐\n3.2초 — 다음 장면',
      html: '<div class="demo cb cb2"><div class="cb-wipe">무소음 키보드</div><div class="cb-num">0</div><div class="cb-cover"></div></div>'
    }
  ];

  var ESF_STYLES = [
    { no: 1, name: '3D 카툰 마을', use: '동네·일상·옛이야기', fx: '팝 인 · 슬라이드 업' },
    { no: 2, name: '도시 타임랩스', use: '변화·성장 비교', fx: '조각보 채우기 · 줌 아웃' },
    { no: 3, name: '데이터 밤 도시', use: '시세·통계·순위', fx: '숫자 카운트업 · 펄스' },
    { no: 4, name: '한지 오림', use: '전통·감성', fx: '블러 인 · 마스크 와이프' },
    { no: 5, name: '수묵 산수', use: '힐링·명언', fx: '페이드 인 · 타이핑' },
    { no: 6, name: '로우폴리 자연', use: '날씨·과학·여행', fx: '줌 아웃 · 틸트 회전' },
    { no: 7, name: '아이소메트릭 단면', use: '과정·원리 설명', fx: '조각보 채우기 · 자막 바' },
    { no: 8, name: '분필 칠판', use: '공부·세금·재테크', fx: '타이핑 · 형광펜 밑줄' },
    { no: 9, name: '3D 지구본 경로', use: '해외 뉴스·파이 글로벌', fx: '줌 인 · 와이프 전환' },
    { no: 10, name: '자개 나전칠기', use: '전통·고급 소개', fx: '페이드 인 · 키워드 색' },
    { no: 11, name: '단청', use: '전통·문화', fx: '조각보 채우기 · 마스크 와이프' },
    { no: 12, name: '책가도', use: '제품·아이템·지식 정리', fx: '플립 인 · 자막 바' },
    { no: 13, name: '청자 상감', use: '공정·만들기', fx: '마스크 와이프 · 줌 인' },
    { no: 14, name: '조각보', use: '요약·체크리스트', fx: '조각보 채우기 · 펄스' },
    { no: 15, name: '병풍', use: '스토리·시리즈', fx: '와이프 전환 · 슬라이드 업' },
    { no: 16, name: '웹툰 컷', use: '썰·사연·드라마', fx: '예능 자막 쾅 · 한 글자씩' },
    { no: 17, name: '노선도', use: '절차·신청 가이드', fx: '자막 바 · 조각보 채우기' },
    { no: 18, name: '네온 골목', use: '가게·메뉴·목록', fx: '키워드 색 · 페이드 인' },
    { no: 19, name: '예능 자막', use: '꿀팁·건강·생활정보', fx: '예능 자막 쾅 · 형광펜 밑줄' },
    { no: 20, name: '한글 조립', use: '낱말·배움터', fx: '한 글자씩 · 플립 인' },
    { no: 21, name: '레트로 브라운관 TV', use: '추억·과거 비교', fx: '셰이크 · 와이프 전환' },
    { no: 22, name: '수채화 풍경', use: '자연·건강·감성', fx: '블러 인 · 페이드 아웃' },
    { no: 23, name: '클레이 인형', use: '캐릭터·재밌는 설명', fx: '바운스 · 팝 인' }
  ];

  /* 기본 항목에는 고정 id 를 붙인다. 저장 키를 올려도 이 id 로 비교해
     사용자가 고친 것은 두고, 새로 추가된 기본값만 채워 넣을 수 있다. */
  DEFAULT_TASKS.forEach(function (t, i) { t.id = 't' + (i < 9 ? '0' : '') + (i + 1); });
  DEFAULT_CONTESTS.forEach(function (c, i) { c.id = 'c' + (i < 9 ? '0' : '') + (i + 1); });
  DEFAULT_MANUAL.forEach(function (m, i) { m.id = 'm' + (i < 9 ? '0' : '') + (i + 1); });

  /* ---------- 지금 돌아가는 축 ---------- */
  var AXES = [
    {
      id: 'yt-main', icon: '🎬', name: '유튜브 · 딜러리세상', sub: '생활지식·건강상식 쇼츠', tone: 'blue',
      state: '15편 공개 · 구독 8명',
      detail: '1호 「이거 모르면 매달 3만 원 그냥 나갑니다」부터 선희 목소리 + 한국어 자막으로 올리는 중. 설명란·고정댓글에 샵 링크를 달아 두었다.',
      href: 'https://www.youtube.com/channel/UC_I4_myPuOysdBNDmAgwPFg'
    },
    {
      id: 'yt-world', icon: '🌏', name: "유튜브 · Dealer's World", sub: '한국 소개(문화·음식·도시·볼거리)', tone: 'gold',
      state: '주 3회 월·수·금 08:00',
      detail: '해외 전용 영어 채널. 11-21 방향을 「한국을 알리는 영상」으로 확정했다. 공공누리 제1유형처럼 상업 이용이 허용된 출처만 쓴다.',
      href: 'https://www.youtube.com/channel/UCXdmTvRav7u54Ot9aKLC1MQ'
    },
    {
      id: 'yt-pi', icon: '🟣', name: '유튜브 · 딜러리세상 파이', sub: '파이 네트워크 매일 스토리', tone: 'violet',
      state: '1호 공개 · 설명란 인증 대기',
      detail: '11-22 07:43 「휴대폰 하나로 시작된 파이, 2019년 3월 14일 그날」 공개 업로드(youtube.com/shorts/3jnsXp6Q5mw). 새 채널이라 스튜디오에서 전화번호 1회 인증을 해야 설명란의 블로그·전자명함 주소가 클릭 링크가 된다.',
      href: 'https://www.youtube.com/channel/UClViYzluay2NCENqKBf0e9Q'
    },
    {
      id: 'pay-apps', icon: '🧮', name: '딜러리 급여 앱 2종', sub: '일급계산기(직원용) · 입금대장(관리자용)', tone: 'soft',
      state: '라이브 · 15개국 다국어',
      detail: '직원용 일급계산기가 15개국 언어(헤더·설정·잠금화면 세 곳에서 전환)와 사진 스타일 달력(하루 금액·오늘 배지·요약 바)을 갖췄고, 입금대장은 인원별 보기와 달력 개편을 마쳤다. 두 앱 모두 하단 소리샘(구글 설문)으로 의견을 받는다. 관리자용은 잠금번호가 있어 여기서는 일급계산기만 바로 연다.',
      href: 'https://lkj7670.github.io/Dealer-studio/daily-pay.html',
      path: 'work/daily-pay/'
    },
    {
      id: 'dutch', icon: '🍻', name: '딜러리의 자동 더치페이', sub: '영수증·메뉴판·해외여행 3모드', tone: 'gold',
      state: '라이브 · 3모드',
      detail: '영수증 사진 한 장으로 술 마신 사람만 빼고 1원 오차 없이 나누고, 메뉴판은 식당에 부를 주문 수량까지 뽑는다. 해외여행은 5개 통화 환율까지. 결과는 카톡 정산 문구로 복사된다.',
      href: 'https://lkj7670.github.io/Dealer-studio/dutch-pay.html',
      path: 'work/dutch-pay/'
    },
    {
      id: 'ds-portal', icon: '🌟', name: '딜러리세상 메인 포털', sub: '무료 앱·채널을 한 곳에', tone: 'soft',
      state: '오픈 · 앱 3종 연결',
      detail: '일급계산기·더치페이·타로(곧 공개)와 블로그·티스토리·유튜브 2채널·틱톡·샵·전자명함을 한 화면에 모았다. 외부 라이브러리 없는 단일 파일이라 유지비 0원.',
      href: 'https://lkj7670.github.io/dealerisesang/',
      path: 'work/dealerisesang-web/'
    },
    {
      id: 'yl-site', icon: '🏢', name: '주식회사 와이엘솔루션 홈페이지', sub: '인력 도급·아웃소싱 B2B', tone: 'blue',
      state: '오픈 · 문의 폼 연결',
      detail: '현장을 아는 인력 도급 파트너로 포지셔닝하고, 인력을 맡기면 입금대장 급여·명세서 관리를 무료로 지원한다는 점을 앞세웠다. 대표 전화와 도급 문의 폼이 붙어 있다.',
      href: 'https://lkj7670.github.io/yl-solution/'
    },
    {
      id: 'market', icon: '🛍️', name: '마켓 · 핫템 플레이스 11개 관', sub: '드라마·연예인·SNS·연령대 핫템', tone: 'coral',
      state: '439개 · 11관 · 티켓관 신설',
      detail: '11-22 「핫템 플레이스」로 10개 관을 전면 리뉴얼하고 🎟️ 티켓·예약·이용권 관(15개)을 새로 만들어 439개. 1번(드라마·영화)·4번(10대)·9번(6070 효도)은 새 상품으로 교체했고, 나머지 관은 아직 옛 상품이라 주제별 인기템 브리핑을 조사 중이다.',
      href: 'https://cshop.naver.com/dealerisesang',
      path: 'work/creator-shop/2026-11-22/'
    },
    {
      id: 'klook', icon: '✈️', name: '클룩 제휴 · 여행·티켓', sub: '입장권·투어·호텔 5% 커미션', tone: 'gold',
      state: 'AID 144466 · 링크 8종',
      detail: '11-22 개통(정산 통화 KRW · 사이트명 Dealers World · blog.naver.com/lkj7670). 제휴 링크 8종을 뽑아 두었다(한국 4 · 해외 4). 정산 계좌·세금 정보는 미입력 — 실제 수령 전 매월 8일까지 넣으면 된다.',
      href: 'https://affiliate.klook.com/',
      path: 'work/klook/affiliate-links-2026-11-22.md'
    },
    {
      id: 'senior', icon: '🧓', name: '시니어 앱 · 쉬운비서 하루', sub: 'v9 52화면 → v10 복지 세분화', tone: 'soft',
      state: 'v9 완성 · 수정 대기',
      detail: '단일 HTML 772KB·52화면. v10 은 복지 카테고리를 다섯 묶음으로 나눈 「복지 한눈에」 화면(53번째)로 설계만 해 두었다. 정리본을 받으면 한 번에 반영한다.',
      path: 'work/senior-app/index.html'
    },
    {
      id: 'nag', icon: '⏰', name: '엄마의 잔소리 스케줄표', sub: 'PWA · 계산기·가계부 포함', tone: 'soft',
      state: '라이브 · 가계부 93/93',
      detail: '미리·정각·지각 3단 잔소리와 상시 동행 모드, 말로 일정 등록, 스마트 계산기 3종, 가계부·재무점검까지. 19쪽 사업보고서도 완성했다.',
      href: 'https://eomma-nag.netlify.app',
      path: 'work/fun-apps/mom-nag/'
    },
    {
      id: 'pi-hackathon', icon: '🚀', name: '파이 해커톤 앱 1', sub: 'Pi Next 출품작 · 9대 카테고리', tone: 'gold',
      state: '참가 등록 완료 · 11/30 재개',
      detail: '마감 2027-01-06 16:59 KST, @lkj7670 참가 등록 완료. 11-30(월) 09:00 알림으로 다시 시작한다 — 클로드 수정본(304줄) 검수·확정과 무료 결제 서버(Cloudflare Workers) 승인부터.',
      path: 'work/pi-hackathon-app-1/기획서.md'
    },
    {
      id: 'contest', icon: '🏆', name: '공모전 · 체험단', sub: '사랑의열매 · 브랜드 커넥트 · 링블', tone: 'coral',
      state: '사랑의열매 접수만 남음',
      detail: '제안서 양식 채움(1,502자) 완료 — 개인/팀·서명만 정하면 접수한다. 브랜드 커넥트·링블 발표 대기 다수, 표어공모전은 12-11 마감이다.',
      path: 'work/contests/chest-2026/제안서-양식채움.hwp'
    }
  ];

  /* ---------- 자동 실행 루틴 (scheduled-actions 확인분 · 2026-11-27 기준 가동분) ---------- */
  var ROUTINES = [
    { time: '05:00', days: '매일', name: '🔄 딜러리세상 작업실 자동 업데이트', note: '현황·보관실 최신화 → 재배포 (새벽 5시 한 번)' },
    { time: '06:00', days: '매일', name: '🟣 네이버 블로그 파이', note: '파이 소식 글 1편' },
    { time: '06:14', days: '매일', name: '☀️ 아침 브리핑', note: '날씨·대기질, 기기 일정, 임박 공모전 스캔' },
    { time: '08:15', days: '월요일', name: '🏛️ 2027 창업지원사업 브리핑', note: '공고·준비사항 점검 (법인·개인 트랙)' },
    { time: '08:30', days: '매일', name: '🏛️ 티스토리 국가 필수정보', note: '정책·지원금·세금 글 1편' },
    { time: '09:00', days: '일요일', name: '🌍 주간 파이 세계 뉴스', note: '일주일 파이 소식 정리 (1회차 11-29)' },
    { time: '10:00', days: '화·목·토', name: '🌿 네이버 블로그 건강·뷰티', note: '혈당·혈압·체중 생활 관리 관점' },
    { time: '11:00', days: '날짜 지정', name: '🎁 체험단·퀴즈 발표 확인', note: '응모한 캠페인 결과만 모아서' },
    { time: '09:00', days: '11-30 한 번', name: '🟣 파이 해커톤 1호 재개', note: '클로드 수정본 검수 → 결제 서버 승인' },
    { time: '21:00', days: '매일', name: '🛡️ 계정 보안 점검', note: '이상 징후가 있으면 바로 알림 (11-26 등록)' }
  ];
  /* 지금은 꺼 둔 루틴 — 다시 켜면 위 목록으로 올라온다. */
  var PAUSED_ROUTINES = [
    '🎬 콘텐츠·체험단 준비', '🌏 딜러스월드 한국소개', '🟣 딜러리세상 파이 쇼츠', '🎭 틱톡 재미 쇼츠',
    '🩺 유튜브 건강 논문 쇼츠', '📈 양자컴퓨터 주식', '⛏️ 인터링크 채굴', '🔬 논문·성분 리서치',
    '🎁 돈되는 이벤트', '🌐 주간 파이·액시스', '🟣 주간 아이온큐'
  ];

  /* ---------- 📅 주간 일정표 (scheduled-actions 등록분을 요일별로 다시 묶음) ---------- */
  /* 매일 공통 — 시간순 */
  var WEEKLY_DAILY = [
    { time: '05:00', name: '🔄 작업실 동기화', note: '현황·보관실 최신화 → 재배포 (새벽 5시 한 번)' },
    { time: '06:00', name: '🟣 네이버 블로그 파이', note: '파이 소식 글 1편' },
    { time: '06:14', name: '☀️ 아침 브리핑', note: '날씨·대기질, 기기 일정, 임박 공모전' },
    { time: '07:30', name: '⏸ 콘텐츠·체험단 준비', note: '일시정지 — 다시 켜면 블로그·숏폼 세트로 돕니다' },
    { time: '08:30', name: '🏛️ 티스토리 국가 필수정보', note: '정책·지원금·세금 글 1편' },
    { time: '08:30', name: '⏸ 양자 주식 브리핑', note: '일시정지 — 아이온큐 중심 뉴스' },
    { time: '09 · 13 · 17 · 21', name: '⏸ 인터링크 채굴', note: '일시정지 — 버튼은 직접' },
    { time: '10:00', name: '⏸ 논문·성분 리서치', note: '일시정지 — 출처 확인한 논문만 적재' },
    { time: '18:30', name: '⏸ 돈되는 이벤트', note: '일시정지 — 새로 뜬 응모·혜택만' },
    { time: '21:00', name: '🛡️ 계정 보안 점검', note: '이상 없으면 조용히, 있으면 바로 알림' }
  ];
  /* 요일별 — 월요일부터 */
  var WEEKLY_DAYS = [
    { key: 'mon', day: '월', items: [
      { time: '08:15', name: '🏛️ 2027 창업지원사업', note: '공고·준비사항 점검' },
      { time: '08:00', name: '⏸ Dealer’s World', note: '일시정지 — 한국 소개 대본' }
    ] },
    { key: 'tue', day: '화', items: [
      { time: '10:00', name: '🌿 건강·뷰티 블로그', note: '생활 관리 관점 1편' },
      { time: '08:00', name: '⏸ 딜러리세상 파이', note: '일시정지 — 파이 쇼츠 대본' }
    ] },
    { key: 'wed', day: '수', items: [
      { time: '08:00', name: '⏸ Dealer’s World', note: '일시정지 — 한국 소개 대본' }
    ] },
    { key: 'thu', day: '목', items: [
      { time: '10:00', name: '🌿 건강·뷰티 블로그', note: '생활 관리 관점 1편' },
      { time: '08:00', name: '⏸ 딜러리세상 파이', note: '일시정지 — 파이 쇼츠 대본' }
    ] },
    { key: 'fri', day: '금', items: [
      { time: '08:00', name: '⏸ Dealer’s World', note: '일시정지 — 한국 소개 대본' }
    ] },
    { key: 'sat', day: '토', items: [
      { time: '10:00', name: '🌿 건강·뷰티 블로그', note: '생활 관리 관점 1편' },
      { time: '09:00', name: '⏸ 주간 파이·액시스', note: '일시정지 — 네이버 파이 + 티스토리 액시스' }
    ] },
    { key: 'sun', day: '일', items: [
      { time: '09:00', name: '🌍 주간 파이 세계 뉴스', note: '일주일 파이 소식 (1회차 11-29)' },
      { time: '09:00', name: '⏸ 주간 아이온큐', note: '일시정지 — 네이버 블로그 초안' }
    ] }
  ];
  /* 날짜가 정해진 확인 — scheduled-actions 의 once 일정 */
  var WEEKLY_DATES = [
    { date: '2026-11-27', time: '11:00', name: '🎁 링블 발표 확인', note: '섬백리향 · AnimalBar' },
    { date: '2026-11-27', time: '20:00', name: '🎁 글로브마크 리뷰 제출 마감', note: '알림은 일시정지 — 직접 챙기기' },
    { date: '2026-11-29', time: '09:00', name: '🌍 주간 파이 세계 뉴스 1회차', note: '일요 연재 시작' },
    { date: '2026-11-30', time: '08:00', name: '👁️ 안과 검진 일정 다시 챙기기', note: '쉬는 날이면 예약' },
    { date: '2026-11-30', time: '09:00', name: '🟣 파이 해커톤 1호 재개', note: '클로드 수정본 검수부터' },
    { date: '2026-11-30', time: '11:00', name: '🎁 체험단·퀴즈 발표 확인', note: '' },
    { date: '2026-12-01', time: '08:00', name: '🗓️ 음성 공모전 날짜 정하기', note: '12월 쉬는 날 확정' },
    { date: '2026-12-04', time: '11:00', name: '🎁 체험단·퀴즈 발표 확인', note: '' },
    { date: '2026-12-31', time: '09:00', name: '🎓 큰딸 졸업식 사전 알림', note: '' },
    { date: '2027-01-07', time: '07:00', name: '🎓 큰딸 졸업식 준비 안내 전화', note: '두 번호로' }
  ];

  /* ---------- 보관실(아카이브) ---------- */
  var ARCH_CATS = ['전체', '웹앱', '유튜브', '블로그·티스토리', '마켓', '공모전·문서', '논문·성분'];
  /* 내용이 바뀐 기본 항목은 id 를 새로 주고 예전 id 를 여기 적는다(이미 저장된 기기에서도 교체됨). */
  var RETIRED_IDS = ['a02'];

  var DEFAULT_ARCHIVE = [
    { id: 'a44', date: '2026-11-27', cat: '웹앱', title: '🍻 딜러리의 자동 더치페이 — 3모드 라이브', note: '영수증 정산(사진·텍스트·샘플, 술 마신 사람만 빼기)·메뉴판 취합(식당 주문 수량까지)·해외여행(5개 통화) 3모드. 단일 HTML 77KB, 라이브 파일이 로컬과 바이트 일치(HTTP 200).', url: 'https://lkj7670.github.io/Dealer-studio/dutch-pay.html', path: 'work/dutch-pay/' },
    { id: 'a45', date: '2026-11-27', cat: '웹앱', title: '🧮 일급계산기 — 15개국 다국어 · 달력 개편 · 소리샘 연결', note: '헤더·설정·잠금화면 세 곳에서 15개 언어 즉시 전환(419문장×14개 언어 내장 사전, 외부 요청 0). 달력은 근무일마다 하루 금액·오늘 배지·요약 바(공제/실수령). 테스트 78/78 + 기존 8종 전부 통과, 라이브 678,994바이트 로컬 일치.', url: 'https://lkj7670.github.io/Dealer-studio/daily-pay.html', path: 'work/daily-pay/' },
    { id: 'a46', date: '2026-11-27', cat: '웹앱', title: '🧾 입금대장(관리자용) — 달력 개편 · 인원별 보기 · 소리샘 연결', note: '인원 선택 바(전체 또는 직원)로 그날 전원 합계와 그 사람 금액만 보기, 달력 아래 요약 바가 직원별로 즉시 바뀐다. 관리자 화면이라 작업실에는 주소를 적지 않는다(급여 앱 카드에서 열기).', path: 'work/daily-pay/' },
    { id: 'a47', date: '2026-11-27', cat: '웹앱', title: '🌟 딜러리세상 메인 포털 오픈 — 앱과 채널을 한 곳에', note: '무료 앱 3종(일급계산기·더치페이·타로 곧 공개)과 채널 6곳, 소리샘·제휴 고지. 단일 HTML 33,839바이트, PC·모바일 콘솔 오류 0·가로 넘침 0.', url: 'https://lkj7670.github.io/dealerisesang/', path: 'work/dealerisesang-web/' },
    { id: 'a48', date: '2026-11-27', cat: '웹앱', title: '🏢 주식회사 와이엘솔루션 공식 홈페이지 오픈', note: '인력 도급·아웃소싱 B2B. 인력을 맡기면 입금대장 급여·명세서 관리를 무료 지원한다는 점을 전면에. 대표 전화·도급 문의 폼 연결, 단일 HTML 46,495바이트, 오류 0.', url: 'https://lkj7670.github.io/yl-solution/' },
    { id: 'a49', date: '2026-11-27', cat: '웹앱', title: '🪪 전자명함에 직원용 급여 앱 소개 링크 추가', note: '명함 안 「딜러리 급여 앱」 카드에서 일급계산기로 바로 이동. 라이브 페이지에서 링크 확인.', url: 'https://lkj7670.github.io/Dealer-card/' },
    { id: 'a50', date: '2026-11-27', cat: '웹앱', title: '🔮 타로 78장 풀이 자료 수집 완료 — 앱 제작 대기', note: '메이저 22장 + 마이너 56장(완드·컵·소드·펜타클 각 14장)을 같은 형식으로 정리해 8개 파일로 모았다. 사단 4명이 나눠 맡았고, 다음은 앱 화면과 해석 조합이다.', path: 'work/tarot/' },
    { id: 'a51', date: '2026-11-27', cat: '유튜브', title: '🎬 차 안 김밥·짜파게티 50초 다큐 쇼츠 (1차 시안)', note: '1080×1920 30fps 50.0초, 선희 톤 내레이션·BGM·자막. 원본 4K를 브라우저로 캡처해 움직임·현장음이 빠진 1차 시안 — 1080p 원본을 받으면 같은 구성으로 다시 뽑는다.', path: 'work/yt-edit/차안-김밥짜파게티-다큐쇼츠.mp4' },
    { id: 'a52', date: '2026-11-26', cat: '공모전·문서', title: '📑 YL솔루션 급여 앱 사업계획서 (15쪽 PDF)', note: '표지+본문 14쪽+부록 3개. 시장·경쟁·수익모델·3년 시나리오·구글 플레이 출시 절차·법적 행정·30일 체크리스트까지, 출처 9건 부록.', path: 'work/daily-pay/YL솔루션-급여앱-사업계획서.pdf' },
    { id: 'a53', date: '2026-11-26', cat: '공모전·문서', title: '📊 급여 앱 광고 수익 사업효과 PPT (28장)', note: '직원용(B2C)·관리자용(B2B) 두 제품을 나눠 광고 수익 구조와 3시나리오를 정리. 16:9 PPTX 28장 + PDF, 네이티브 차트 3개.', path: 'work/daily-pay/YL솔루션-광고수익-사업효과-PPT.pptx' },
    { id: 'a39', date: '2026-11-22', cat: '유튜브', title: '「딜러리세상 파이」 1호 공개 — 휴대폰 하나로 시작된 파이', note: '07:43 공개 업로드. 새 채널 @dealerisesangpi. 설명란 링크를 클릭 링크로 만들려면 스튜디오 전화번호 1회 인증이 남았다.', url: 'https://youtube.com/shorts/3jnsXp6Q5mw' },
    { id: 'a40', date: '2026-11-22', cat: '블로그·티스토리', title: '[긴급] 사칭피싱주의 — 액시스 가짜 에어드랍', note: '06:59 발행·전체공개. 가짜 주소 50개 목록과 공식 4종 비교, 업비트 1시간봉. 태그 10개.', url: 'https://blog.naver.com/lkj7670/224486687654', path: 'work/axis-phishing-2026-11-22/published-post.md' },
    { id: 'a41', date: '2026-11-22', cat: '마켓', title: '클룩(Klook) 제휴 파트너 개통 — AID 144466', note: 'KRW 정산 · 사이트명 Dealers World · 커미션 최대 5%. 제휴 링크 8종 발급. 정산 계좌·세금 정보는 미입력(매월 8일까지).', url: 'https://affiliate.klook.com/', path: 'work/klook/affiliate-links-2026-11-22.md' },
    { id: 'a42', date: '2026-11-22', cat: '마켓', title: '🎟️ 티켓·예약·이용권 핫템 예시관 신설 (15개)', note: '컬렉션 ID 1019908935411136. 대학로 연극 23%·18%, 뮤지컬 18%. 샵 등록 424 → 439개.', url: 'https://cshop.naver.com/dealerisesang?c=1019908935411136', path: 'work/ticket-reservation-2026-11-22/보고서-티켓예약관-2026-11-22.md' },
    { id: 'a43', date: '2026-11-22', cat: '웹앱', title: '전자명함 명함 시안 — 로열 네이비 & 민트 확정', note: '2번안을 골라 전자명함 안 명함 이미지로 반영. 로컬 완성(사이트 zip 대기).', path: 'work/business-card/designs/card_2_navy_mint.png' },
    { id: 'a01', date: '2026-11-22', cat: '웹앱', title: '딜러리세상 작업실 — 4탭 재구성', note: 'AI 사무실 현황(축·자동 루틴)과 보관실 신설. 저장 키 v1→v2 자동 이전, 캐시 v6.', url: 'https://dealerisesang-studio.netlify.app', path: 'work/dealer-studio/' },
    { id: 'a02b', date: '2026-11-22', cat: '마켓', title: '크리에이터샵 10개 관 전체 물갈이 — 361→413개', note: '무료배송·1~3만 원대 기준으로 10관 전부 교체. 신규 14개 등록, 관 연결 427건.', url: 'https://cshop.naver.com/dealerisesang', path: 'work/creator-shop/2026-11-22/물갈이-결과-2026-11-22.md' },
    { id: 'a38', date: '2026-11-22', cat: '마켓', title: '남은 2관(재테크·가전) + 못산템 순서 마무리', note: '재테크 유료배송 8개·가전 소모품 6개를 무료배송 액세서리로 교체하고, 못산템 1~3번째에 1~3만 원대 진입템을 올렸다.', path: 'work/creator-shop/2026-11-22/남은-2관-순서-완료-결과-2026-11-22.md' },
    { id: 'a03', date: '2026-11-21', cat: '웹앱', title: '엄마의 잔소리 스케줄표 — 계산기·가계부 추가', note: '할인·단가 비교 계산기와 저축률·비상금·투자 여력 점검. 가계부 검사 93/93.', url: 'https://eomma-nag.netlify.app', path: 'work/fun-apps/mom-nag/' },
    { id: 'a04', date: '2026-11-21', cat: '웹앱', title: '딜러리세상 작업실 최초 배포 (3탭)', note: 'AI 사무실·작업 보드·매뉴얼, 모션 26종, 공모전 16건. 로컬·라이브 58/58 통과.', url: 'https://dealerisesang-studio.netlify.app' },
    { id: 'a05', date: '2026-11-21', cat: '웹앱', title: '시니어 앱 v9 — 팬·쇼핑 탭 (52화면)', note: '하단 5번째 탭에 인물 스케줄·쇼핑관 연결. 콘솔 오류 0건으로 헤드리스 검사 완료.', path: 'work/senior-app/index.html' },
    { id: 'a06', date: '2026-11-20', cat: '웹앱', title: '전자명함 DEALER LEE\u2019S WORLD 배포', note: '다크 럭셔리 골드 1번안. 8개 채널 링크·연락처 저장(.vcf)·QR·후원 블록 포함.', url: 'https://dealer-lees-world.netlify.app', path: 'work/digital-card/card-1-black-gold.html' },
    { id: 'a07', date: '2026-11-19', cat: '웹앱', title: '시니어 앱 v8 — 반려동물 챙기기·자랑하기', note: '사람 챙기기와 같은 저장소를 써서 홈 「오늘 할 일」에 함께 뜬다.', path: 'work/senior-app/index-v8.html' },

    { id: 'a08', date: '2026-11-21', cat: '유튜브', title: '딜러리세상 파이 채널 개설', note: '프로필·배너·소개문·키워드·차단어 설정 완료. 매일 파이 스토리 연재 준비.', url: 'https://www.youtube.com/channel/UClViYzluay2NCENqKBf0e9Q' },
    { id: 'a09', date: '2026-11-20', cat: '유튜브', title: '딜러리세상 1호 「이거 모르면 매달 3만 원 그냥 나갑니다」', note: '선희 목소리·한국어 자막. 구독 8명 상태에서 조회 594회까지 올랐다.', url: 'https://youtube.com/shorts/zjlCqjnCN7w' },
    { id: 'a10', date: '2026-11-20', cat: '유튜브', title: '「커피 한 잔이 새벽 2시까지 남는 이유」', note: '카페인 반감기 5시간. 대한수면의학회·FDA·식품안전나라 근거를 설명란에 달았다.', url: 'https://youtube.com/shorts/j02u3xNSytA' },
    { id: 'a11', date: '2026-11-20', cat: '유튜브', title: '「12월 선물, 5만 원대 홍삼진건 40ml 30포」', note: '대가성 문구를 설명 첫 줄에. 건강관·샵 전체 링크 연결.', url: 'https://youtube.com/shorts/kWelX53zQQE' },
    { id: 'a12', date: '2026-11-20', cat: '유튜브', title: "Dealer's World 1호 영어 쇼츠 공개", note: '해외 전용 채널 첫 영어 영상. 09:00 예약대로 공개 확인.', url: 'https://youtube.com/shorts/7__FeQ9x6TI' },
    { id: 'a13', date: '2026-11-20', cat: '유튜브', title: '틱톡 미스터리 1호 — 퉁구스카 대폭발', note: 'NASA·Boslough 근거와 해시태그 7개. 같은 소재 반복 금지 원칙 적용.', url: 'https://www.tiktok.com/@dyrji44gvaq9/video/7710027093597375796' },
    { id: 'a14', date: '2026-11-20', cat: '유튜브', title: '유튜브 15편·틱톡 영상 샵 고정댓글 완료', note: '기존 초대코드 댓글은 살리고 샵 소개 + 대가성 문구를 합쳐 고정.', path: 'work/shop-pinned-comments/2026-11-20/고정댓글-결과.md' },
    { id: 'a15', date: '2026-11-19', cat: '유튜브', title: "Dealer's World 채널 개설", note: '해외 전용 유튜브. 11-21 한국 소개 주제로 방향 확정.', url: 'https://www.youtube.com/channel/UCXdmTvRav7u54Ot9aKLC1MQ' },

    { id: 'a16', date: '2026-11-21', cat: '블로그·티스토리', title: '[주간 파이 글로벌 #01] 첫 서밋 3일, 개발자 도구는 늘고 파이는 최저', note: '매주 토요일 연재 1호. 5단 포맷 + 요약표 + 후원 블록.', url: 'https://blog.naver.com/lkj7670/224485587621' },
    { id: 'a17', date: '2026-11-21', cat: '블로그·티스토리', title: '[주간 액시스 #01] 첫 보상과 첫 물량이 겹친 토요일', note: '티스토리 연재 1호. 카테고리 없음으로 올라가 「경제」 이동 여부만 남음.', url: 'https://lkj7670.tistory.com/85' },
    { id: 'a18', date: '2026-11-21', cat: '블로그·티스토리', title: '파이코인 서밋 가이드 — 니콜라스 박사가 보여준 10분 AI 앱 만들기', note: '영상 3개·전자명함 클릭 링크, 용어 10개 풀이. 피클 언급 없이 발행.', url: 'https://blog.naver.com/lkj7670/224485604011' },
    { id: 'a19', date: '2026-11-20', cat: '블로그·티스토리', title: '액시스로보틱스 1주일 소식 정리', note: '글로벌 로보틱스 동향 + 온체인 데이터 각도. 발행 확인 완료.', url: 'https://blog.naver.com/lkj7670/224485133602' },
    { id: 'a20', date: '2026-11-20', cat: '블로그·티스토리', title: '공지 — 딜러리세상 크리에이터샵, 정품만 모은 열 개의 관', note: '본문 글자는 그대로 두고 샵 링크 11개만 클릭 링크로 걸어 상단 고정.', url: 'https://blog.naver.com/lkj7670/224484312509' },
    { id: 'a21', date: '2026-11-20', cat: '블로그·티스토리', title: '몽벨 튜브테크 자켓 실물 후기', note: '직접 찍은 사진 + 새 말투 후기. 아웃도어관 상품으로 연결.', url: 'https://blog.naver.com/lkj7670/224484551132' },
    { id: 'a22', date: '2026-11-19', cat: '블로그·티스토리', title: '갤럭시 버즈 코어 후기', note: '가전·모바일관 연결. 실물 사진 기반 후기 방식의 첫 적용.', url: 'https://blog.naver.com/lkj7670/224483828360' },
    { id: 'a23', date: '2026-11-19', cat: '블로그·티스토리', title: '4컷 만화 — 생활 필수소비관 이야기', note: '생활관 연결. 글천개 문체로 리라이팅해 발행.', url: 'https://blog.naver.com/lkj7670/224483649266' },
    { id: 'a24', date: '2026-11-18', cat: '블로그·티스토리', title: '파이네트워크 시리즈 ① 가입부터 첫 채굴까지', note: '7편 시리즈의 1편. ⑤메인넷 체크리스트·⑥KYC·⑦메인넷 이전까지 이어서 발행.', url: 'https://blog.naver.com/lkj7670/224482215394', path: 'work/pi-blog-series/' },
    { id: 'a25', date: '2026-11-18', cat: '블로그·티스토리', title: '파이네트워크 시리즈 ⑥ KYC 신청과 승인', note: '주간 연재에서 「지난 시리즈」 링크로 다시 연결한 글.', url: 'https://blog.naver.com/lkj7670/224482240308' },

    { id: 'a26', date: '2026-11-22', cat: '마켓', title: '고정댓글 2단계 동선 — 대표 영상 → 마켓', note: '믿음을 주는 대표 영상 1편으로 먼저 보낸 뒤 그 영상에서 샵으로 연결하는 구조.', path: 'work/marketing/pinned-comment-funnel-2026-11-22.md' },
    { id: 'a27', date: '2026-11-20', cat: '마켓', title: '361개 상품 전수 가격조사·최저가 비교', note: '평균 83,192원·중앙값 49,800원. 동일 상품 12개는 네이버 최저가보다 평균 6% 높았다.', path: 'work/creator-shop/price-audit-2026-11-20/가격-비교-보고서-2026-11-20.md' },
    { id: 'a28', date: '2026-11-20', cat: '마켓', title: '샵 홍보 실행안 — 가격·마케팅·체험단 진단', note: '판매 0건의 원인은 가격이 아니라 유입. 실행 순서를 정리한 문서.', path: 'work/marketing/shop-marketing-plan-2026-11-20.md' },
    { id: 'a29', date: '2026-11-19', cat: '마켓', title: '크리에이터샵 10개 관 361개 상품 확장', note: '관별 한도 확인 후 86개 → 361개로 확장 완료. 컬렉션 현황표 포함.', url: 'https://cshop.naver.com/dealerisesang', path: 'work/creator-shop/컬렉션-현황-2026-11-19.md' },
    { id: 'a30', date: '2026-11-21', cat: '마켓', title: '브랜드 커넥트 체험단 2건 신청 (글로브마크·키핀)', note: '평생이용권 29,900원형 무료 체험단. 11-23 발표 확인 대기.', path: 'work/brandconnect-2026-11-21/' },

    { id: 'a31', date: '2026-11-21', cat: '공모전·문서', title: '사랑의열매 배분사업 아이디어 제안서 (양식 채움)', note: '1,502자 + 공식 양식 HWP + 미리보기 PDF. 개인/팀·서명만 정하면 접수.', path: 'work/contests/chest-2026/제안서-양식채움.hwp' },
    { id: 'a32', date: '2026-11-21', cat: '공모전·문서', title: '엄마의 잔소리 스케줄표 사업보고서 (19쪽)', note: 'MAU 1천·1만·5만 시나리오와 수익화 단계, 권리화 순서까지 정리.', path: 'work/fun-apps/mom-nag/사업보고서-2026-11-21.md' },
    { id: 'a33', date: '2026-11-21', cat: '공모전·문서', title: '파이 해커톤 앱 1 기획서 (9대 카테고리 + 10장)', note: 'Pi Next 룰 확인분 반영. Pi App Studio 영문 주문서가 다음 단계.', path: 'work/pi-hackathon-app-1/기획서.md' },
    { id: 'a34', date: '2026-11-21', cat: '공모전·문서', title: 'ESF 3D 모션 23종 이식', note: '스타일 프롬프트 23개와 검증 스크립트. 모션 사전 탭과 연결돼 있다.', path: 'work/imported-skills/esf-3d-motion/' },
    { id: 'a35', date: '2026-11-21', cat: '공모전·문서', title: '주간 연재 1호 조사 자료 (파이 글로벌 · 액시스)', note: '본문·요약표 이미지·구간 데이터까지. 다음 회차는 회차 번호를 이어 간다.', path: 'work/weekly-series/' },
    { id: 'a36', date: '2026-11-20', cat: '공모전·문서', title: 'AI 마케팅 실무 30장 분석 → 샵 적용안', note: '영상 전체 내용을 노트로 옮기고 우리 채널·샵에 맞게 다시 정리.', path: 'work/marketing/data/' },
    { id: 'a37', date: '2026-11-22', cat: '논문·성분', title: '논문·성분 보관함 — 출처를 확인한 자료만', note: '매일 10:00 자동 누적 예정(아직 첫 실행 전). 논문 원문·성분표·공식 기준을 확인한 것만 날짜와 출처 링크와 함께 쌓습니다.', path: 'work/research-vault/' }
  ];

  /* =========================================================
     2. 상태
     ========================================================= */
  var state = null;
  var timers = [];
  var bubbleTimer = null;
  var undoAction = null;
  var toastTimer = null;

  function uid() { return Math.random().toString(36).slice(2, 9); }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1) + '-' +
      (d.getDate() < 10 ? '0' : '') + d.getDate();
  }
  function normTitle(s) { return String(s == null ? '' : s).replace(/\s+/g, '').toLowerCase(); }

  function defaultTasks() {
    return DEFAULT_TASKS.map(function (t) { return { id: t.id, title: t.title, owner: t.owner, stage: t.stage }; });
  }
  function defaultContests() {
    return DEFAULT_CONTESTS.map(function (c) {
      return {
        id: c.id, title: c.title, org: c.org, kind: c.kind, due: c.due,
        reward: c.reward, status: c.status, memo: c.memo, url: c.url || '', dueLabel: c.dueLabel || ''
      };
    });
  }
  function defaultManual() {
    return DEFAULT_MANUAL.map(function (m) { return { id: m.id, title: m.title, text: m.text, copy: m.copy || '' }; });
  }
  function defaultArchive() {
    return DEFAULT_ARCHIVE.map(function (a) {
      return { id: a.id, date: a.date, cat: a.cat, title: a.title, note: a.note, url: a.url || '', path: a.path || '' };
    });
  }

  function defaults() {
    return {
      tasks: defaultTasks(),
      contests: defaultContests(),
      manual: defaultManual(),
      archive: defaultArchive(),
      removed: [],
      fxFilter: '전체',
      contestFilter: '전체',
      archiveCat: '전체',
      archiveQuery: '',
      view: 'office',
      rev: 2
    };
  }

  /* 저장본에 기본값을 "병합"한다.
     - 같은 id 는 저장본 것을 쓰고(사용자가 고친 내용 보존)
     - 예전(v1) 저장본에 랜덤 id 로 들어 있던 기본 항목은 제목으로 찾아 기본 id 를 준다
     - 사용자가 지운 기본 항목은 removed 에 남아 다시 살아나지 않는다 */
  function mergeSaved(saved) {
    var s = (saved && typeof saved === 'object') ? saved : {};
    var out = defaults();
    out.removed = Array.isArray(s.removed) ? s.removed.slice() : [];

    function build(list, defs, mapper) {
      var arr = Array.isArray(list) ? list.slice() : [];
      defs.forEach(function (d) {
        for (var i = 0; i < arr.length; i++) {
          if (normTitle(arr[i].title) === normTitle(d.title) && (!arr[i].id || String(arr[i].id).indexOf('d-') !== 0)) {
            arr[i].id = d.id;
            break;
          }
        }
      });
      defs.forEach(function (d) {
        var exists = arr.some(function (it) { return it.id === d.id; });
        if (!exists && out.removed.indexOf(d.id) < 0) arr.push(mapper(d));
      });
      return arr;
    }

    out.tasks = build(s.tasks, DEFAULT_TASKS, function (d) { return { id: d.id, title: d.title, owner: d.owner, stage: d.stage }; });
    out.contests = build(s.contests, DEFAULT_CONTESTS, function (c) {
      return {
        id: c.id, title: c.title, org: c.org, kind: c.kind, due: c.due,
        reward: c.reward, status: c.status, memo: c.memo, url: c.url || '', dueLabel: c.dueLabel || ''
      };
    });
    out.manual = build(s.manual, DEFAULT_MANUAL, function (m) { return { id: m.id, title: m.title, text: m.text, copy: m.copy || '' }; });
    out.archive = build(s.archive, DEFAULT_ARCHIVE, function (a) {
      return { id: a.id, date: a.date, cat: a.cat, title: a.title, note: a.note || '', url: a.url || '', path: a.path || '' };
    });
    // 사용자가 직접 넣은 항목이 빠지지 않게 한다(기본 id 가 없는 것들).
    if (Array.isArray(s.tasks)) out.tasks = out.tasks.concat(s.tasks.filter(function (t) {
      return t && t.id && !DEFAULT_TASKS.some(function (d) { return d.id === t.id; }) && !out.tasks.some(function (o) { return o.id === t.id; });
    }));
    if (Array.isArray(s.archive)) out.archive = out.archive.concat(s.archive.filter(function (a) {
      return a && a.id && !DEFAULT_ARCHIVE.some(function (d) { return d.id === a.id; }) && !out.archive.some(function (o) { return o.id === a.id; });
    }));

    // 내용이 바뀐 기본 카드는 마지막에 한 번 더 걸러 낸다(사용자 항목으로 되살아나지 않게).
    out.archive = out.archive.filter(function (a) { return RETIRED_IDS.indexOf(a.id) < 0; });

    out.fxFilter = s.fxFilter || '전체';
    out.contestFilter = s.contestFilter || '전체';
    out.archiveCat = s.archiveCat || '전체';
    out.archiveQuery = s.archiveQuery || '';
    out.view = ['office', 'motion', 'contest', 'archive'].indexOf(s.view) >= 0 ? s.view : 'office';
    out.rev = 2;
    return out;
  }

  function load() {
    var saved = null;
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) saved = JSON.parse(raw);
    } catch (e) { saved = null; }
    if (!saved) {
      // v1 저장본(랜덤 id·archive 없음)을 그대로 이어받는다. v1 키는 백업으로 남긴다.
      try {
        var old = localStorage.getItem(KEY_V1);
        if (old) saved = JSON.parse(old);
      } catch (e) { saved = null; }
    }
    return mergeSaved(saved);
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 저장 실패는 조용히 넘어감 */ }
  }

  /* =========================================================
     3. 도우미
     ========================================================= */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function todayMidnight() {
    var d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }
  function daysUntil(iso) {
    if (!iso) return null;
    var parts = iso.split('-');
    if (parts.length !== 3) return null;
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(d.getTime())) return null;
    return Math.round((d.getTime() - todayMidnight().getTime()) / 86400000);
  }
  function ddayText(iso) {
    var n = daysUntil(iso);
    if (n === null) return { text: '일정 미정', cls: 'done' };
    if (n === 0) return { text: 'D-DAY', cls: 'hot' };
    if (n < 0) return { text: '지남', cls: 'done' };
    if (n <= 3) return { text: 'D-' + n, cls: 'hot' };
    if (n <= 7) return { text: 'D-' + n, cls: 'soon' };
    return { text: 'D-' + n, cls: '' };
  }
  function fmtDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    if (p.length !== 3) return iso;
    return Number(p[1]) + '/' + Number(p[2]);
  }
  function staffById(id) {
    for (var i = 0; i < STAFF.length; i++) if (STAFF[i].id === id) return STAFF[i];
    return STAFF[0];
  }
  function showToast(msg, undoFn) {
    var el = $('#toast');
    el.innerHTML = esc(msg) + (undoFn ? '<button class="undo" type="button">되살리기</button>' : '');
    el.hidden = false;
    undoAction = undoFn || null;
    var btn = $('.undo', el);
    if (btn && undoFn) {
      btn.addEventListener('click', function () {
        if (undoAction) { undoAction(); undoAction = null; }
        hideToast();
      });
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, undoFn ? 6000 : 2200);
  }
  function hideToast() { $('#toast').hidden = true; undoAction = null; }

  function accountText(t) {
    return esc(t).replace(/132103354631/g, '<span class="acct">132103354631</span>');
  }

  /* =========================================================
     4. 탭 · 날짜
     ========================================================= */
  function switchView(name) {
    ['office', 'motion', 'contest', 'archive'].forEach(function (v) {
      var sec = $('#view-' + v);
      if (sec) sec.hidden = (v !== name);
    });
    $$('.tab').forEach(function (b) {
      var on = b.getAttribute('data-view') === name;
      b.classList.toggle('is-active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    state.view = name;
    save();
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (name === 'motion') observeStages();
  }

  function renderToday() {
    var d = new Date();
    var wd = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    var soon = state.contests.filter(function (c) {
      var n = daysUntil(c.due);
      return c.status !== '제외' && n !== null && n >= 0 && n <= 3;
    }).length;
    $('#todayLine').textContent = d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + wd + '요일' +
      (soon ? ' · 임박 ' + soon + '건' : '');
  }

  /* =========================================================
     5. AI 사무실
     ========================================================= */
  function personHTML(s, isLeader) {
    return '<button class="person' + (isLeader ? ' leader' : '') + '" type="button" data-staff="' + s.id + '" ' +
      'aria-label="' + esc(s.name) + ' — ' + esc(s.role) + '">' +
      '<span class="bubble" data-bubble="' + s.id + '">' + esc(s.lines[0]) + '</span>' +
      '<span class="avatar" style="background:' + s.color + '" aria-hidden="true">' + s.emoji + '</span>' +
      '<span class="name">' + esc(s.name) + '</span>' +
      '<span class="desk" aria-hidden="true"></span>' +
      '</button>';
  }

  function renderOffice() {
    var leader = STAFF[0];
    $('#leaderDesk').innerHTML = personHTML(leader, true);
    $('#staffGrid').innerHTML = STAFF.slice(1).map(function (s) { return personHTML(s, false); }).join('');

    $$('.person').forEach(function (p) {
      p.addEventListener('click', function () { openStaff(p.getAttribute('data-staff')); });
    });

    clearInterval(bubbleTimer);
    bubbleTimer = setInterval(rotateBubbles, 5200);
  }

  function rotateBubbles() {
    STAFF.forEach(function (s) {
      var el = $('[data-bubble="' + s.id + '"]');
      if (!el) return;
      var pool = staffLines(s);
      if (pool.length < 2) return;
      el.style.opacity = '0';
      setTimeout(function () {
        var next = pool[(Math.floor(Math.random() * pool.length))];
        if (next && next !== el.textContent) el.textContent = next;
        el.style.opacity = '1';
      }, 280);
    });
  }

  function staffLines(s) {
    var mine = state.tasks.filter(function (t) { return t.owner === s.id && t.stage !== 'done'; });
    var pool = s.lines.slice();
    if (mine.length) pool.unshift(mine[0].title.length > 24 ? mine[0].title.slice(0, 23) + '…' : mine[0].title);
    return pool;
  }

  function openStaff(id) {
    var s = staffById(id);
    var mine = state.tasks.filter(function (t) { return t.owner === s.id; });
    var open = mine.filter(function (t) { return t.stage !== 'done'; });
    var done = mine.filter(function (t) { return t.stage === 'done'; });
    var list = open.concat(done).slice(0, 4);

    var rows = list.map(function (t) {
      var st = t.stage === 'doing' ? '#e6a23c' : t.stage === 'review' ? '#6b5cc4' : '#2c8b73';
      return '<div class="staff-task"><span class="dot" style="background:' + st + '"></span><span>' +
        esc(t.title) + '</span></div>';
    }).join('');
    if (!rows) rows = '<div class="empty">지금 맡은 일이 없어요. 아래 버튼으로 일을 맡겨 보세요.</div>';

    $('#staffTitle').textContent = s.name + ' · ' + s.role;
    $('#staffBody').innerHTML =
      '<div class="staff-hero"><span class="avatar" style="background:' + s.color + '" aria-hidden="true">' + s.emoji + '</span>' +
      '<div><h3>' + esc(s.name) + '</h3><p>' + esc(s.role) + '</p></div></div>' +
      '<p class="legend">맡은 일 ' + open.length + '건 진행 · 완료 ' + done.length + '건</p>' +
      rows +
      '<div class="staff-actions">' +
      '<button class="btn primary" type="button" id="assignBtn">일 맡기기</button>' +
      '<button class="btn ghost" type="button" id="staffManualBtn">📘 매뉴얼</button>' +
      '</div>';
    openSheet('#staffSheet');

    $('#assignBtn').addEventListener('click', function () {
      closeSheet('#staffSheet');
      switchView('office');
      $('#taskOwner').value = s.id;
      $('#taskTitle').focus();
      showToast(s.name + '에게 일을 맡겨 보세요');
    });
    $('#staffManualBtn').addEventListener('click', function () {
      closeSheet('#staffSheet');
      openManual();
    });
  }

  function renderStats() {
    var doing = state.tasks.filter(function (t) { return t.stage === 'doing'; }).length;
    var review = state.tasks.filter(function (t) { return t.stage === 'review'; }).length;
    var soon = state.contests.filter(function (c) {
      var n = daysUntil(c.due);
      return c.status !== '제외' && n !== null && n >= 0 && n <= 7;
    }).length;
    $('#officeStats').innerHTML =
      '<div class="stat"><b>' + doing + '</b><span>진행 중</span></div>' +
      '<div class="stat gold"><b>' + review + '</b><span>검토 대기</span></div>' +
      '<div class="stat urgent"><b>' + soon + '</b><span>7일 안 임박</span></div>';
  }

  function renderBoard() {
    var counts = { doing: 0, review: 0, done: 0 };
    state.tasks.forEach(function (t) { if (counts[t.stage] != null) counts[t.stage]++; });
    $('#boardCount').textContent = state.tasks.length + '개';

    $('#board').innerHTML = STAGES.map(function (st) {
      var list = state.tasks.filter(function (t) { return t.stage === st.id; });
      var cards = list.map(function (t) {
        var idx = STAGES.findIndex(function (s) { return s.id === t.stage; });
        var owner = staffById(t.owner);
        return '<article class="task' + (t.stage === 'done' ? ' done' : '') + '" data-id="' + t.id + '">' +
          '<div class="task-top"><p class="task-title">' + esc(t.title) + '</p></div>' +
          '<div class="task-meta"><span class="owner">' + owner.emoji + ' ' + esc(owner.name) + '</span></div>' +
          '<div class="task-actions">' +
          '<button class="mini tobox" type="button" data-act="archive" aria-label="보관실로 보내기" title="보관실로 보내기">📦</button>' +
          '<button class="mini" type="button" data-act="prev" aria-label="이전 단계로" ' + (idx === 0 ? 'disabled' : '') + '>◀</button>' +
          '<button class="mini" type="button" data-act="next" aria-label="다음 단계로" ' + (idx === STAGES.length - 1 ? 'disabled' : '') + '>▶</button>' +
          '<button class="mini del" type="button" data-act="del" aria-label="삭제">✕</button>' +
          '</div></article>';
      }).join('');
      return '<section class="col" data-stage="' + st.id + '">' +
        '<div class="col-head"><h3><span class="dot"></span>' + st.name + '</h3><span class="n">' + list.length + '</span></div>' +
        '<div class="col-list">' + (cards || '<div class="empty" style="padding:14px 8px;font-size:12px">비어 있어요</div>') + '</div>' +
        '</section>';
    }).join('');

    $$('#board .task').forEach(function (card) {
      card.addEventListener('click', function (ev) {
        var btn = ev.target.closest('button[data-act]');
        if (!btn) return;
        var id = card.getAttribute('data-id');
        var act = btn.getAttribute('data-act');
        var task = state.tasks.find(function (t) { return t.id === id; });
        if (!task) return;
        if (act === 'del') {
          var idx = state.tasks.indexOf(task);
          state.tasks.splice(idx, 1);
          if (String(task.id).charAt(0) === 't' && DEFAULT_TASKS.some(function (d) { return d.id === task.id; })) {
            state.removed.push(task.id);
          }
          save(); renderBoard(); renderStats();
          showToast('할 일을 지웠어요', function () {
            state.tasks.splice(Math.min(idx, state.tasks.length), 0, task);
            state.removed = state.removed.filter(function (r) { return r !== task.id; });
            save(); renderBoard(); renderStats();
          });
          return;
        }
        if (act === 'archive') {
          var at = state.tasks.indexOf(task);
          var owner = staffById(task.owner);
          state.tasks.splice(at, 1);
          var arch = {
            id: uid(), date: todayISO(), cat: catForOwner(task.owner),
            title: task.title, note: '작업 보드에서 보낸 카드 · ' + owner.name,
            url: '', path: ''
          };
          state.archive.unshift(arch);
          save(); renderBoard(); renderStats(); renderArchiveAll();
          showToast('보관실로 옮겼어요', function () {
            state.archive = state.archive.filter(function (a) { return a.id !== arch.id; });
            state.tasks.splice(Math.min(at, state.tasks.length), 0, task);
            save(); renderBoard(); renderStats(); renderArchiveAll();
          });
          return;
        }
        var cur = STAGES.findIndex(function (s) { return s.id === task.stage; });
        var next = act === 'next' ? Math.min(cur + 1, STAGES.length - 1) : Math.max(cur - 1, 0);
        if (next !== cur) {
          task.stage = STAGES[next].id;
          save(); renderBoard(); renderStats();
          showToast('「' + (task.title.length > 14 ? task.title.slice(0, 14) + '…' : task.title) + '」 → ' + STAGES[next].name);
        }
      });
    });
  }

  function initTaskForm() {
    $('#taskOwner').innerHTML = STAFF.map(function (s) {
      return '<option value="' + s.id + '">' + s.emoji + ' ' + s.name + '</option>';
    }).join('');
    $('#taskForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var title = $('#taskTitle').value.trim();
      if (!title) return;
      state.tasks.unshift({
        id: uid(), title: title,
        owner: $('#taskOwner').value,
        stage: $('#taskStage').value
      });
      save();
      $('#taskTitle').value = '';
      renderBoard(); renderStats();
      showToast('작업 보드에 올렸어요');
    });
  }

  /* =========================================================
     6. 모션 효과 사전
     ========================================================= */
  function renderMotionFilters() {
    var cats = ['전체', '등장', '퇴장', '강조', '자막', '카메라', '전환'];
    $('#motionFilters').innerHTML = cats.map(function (c) {
      var n = c === '전체' ? FX.length : FX.filter(function (f) { return f.cat === c; }).length;
      return '<button class="filter' + (state.fxFilter === c ? ' is-on' : '') + '" type="button" data-cat="' + c + '">' +
        c + ' ' + n + '</button>';
    }).join('');
    $$('#motionFilters .filter').forEach(function (b) {
      b.addEventListener('click', function () {
        state.fxFilter = b.getAttribute('data-cat');
        save(); renderMotionFilters(); renderMotion();
      });
    });
    $('#motionCount').textContent = FX.length + '종';
  }

  function renderMotion() {
    var list = state.fxFilter === '전체' ? FX : FX.filter(function (f) { return f.cat === state.fxFilter; });
    $('#motionGrid').innerHTML = list.map(function (f, i) {
      return '<article class="fx-card" data-fx="' + f.id + '">' +
        '<div class="stage" data-stage="' + f.id + '" role="img" aria-label="' + esc(f.name) + ' 미리보기">' +
        f.html + '</div>' +
        '<div class="fx-head"><span class="fx-name">' + esc(f.name) + '</span>' +
        '<span class="chip ' + catChip(f.cat) + '">' + f.cat + '</span></div>' +
        '<p class="fx-desc">' + esc(f.desc) + '</p>' +
        '<p class="fx-prompt" data-prompt="' + f.id + '">' + esc(f.prompt) + '</p>' +
        '<div class="fx-actions">' +
        '<button class="btn copy" type="button" data-copy="' + f.id + '">프롬프트 복사</button>' +
        '<button class="btn ghost replay" type="button" data-replay="' + f.id + '" aria-label="다시 보기">↻</button>' +
        '</div>' +
        '</article>';
    }).join('');
    bindMotionCards();
    observeStages();
  }

  function catChip(cat) {
    return cat === '등장' ? 'blue' : cat === '퇴장' ? 'dim' : cat === '강조' ? 'gold' :
      cat === '자막' ? 'coral' : cat === '카메라' ? 'violet' : 'soft';
  }

  function bindMotionCards() {
    $$('.fx-card').forEach(function (card) {
      var stage = $('.stage', card);
      stage.addEventListener('click', function () { playStage(stage); });
      var rep = $('[data-replay]', card);
      if (rep) rep.addEventListener('click', function (e) { e.stopPropagation(); playStage(stage); });
      var pr = $('.fx-prompt', card);
      if (pr) pr.addEventListener('click', function () { pr.classList.toggle('open'); });
      var cp = $('[data-copy]', card);
      if (cp) cp.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = cp.getAttribute('data-copy');
        var fx = FX.find(function (f) { return f.id === id; });
        copyText('[' + fx.name + ']\n' + fx.prompt, cp);
      });
    });
  }

  function playStage(stage) {
    if (!stage) return;
    stage.classList.remove('play');
    void stage.offsetWidth; // 애니메이션 재시작
    stage.classList.add('play');
    runSpecial(stage);
  }

  function runSpecial(stage) {
    var id = stage.getAttribute('data-stage');
    if (id === 'countup') {
      var num = $('.num', stage);
      if (!num) return;
      var target = Number(num.getAttribute('data-count') || 0);
      var small = num.querySelector('small');
      var start = null;
      var dur = 1200;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = Math.round(target * eased);
        num.firstChild.nodeValue = val.toLocaleString('ko-KR');
        if (small) small.textContent = '명';
        if (p < 1) requestAnimationFrame(step);
      }
      num.firstChild.nodeValue = '0';
      requestAnimationFrame(step);
    }
    if (id === 'typing') {
      var el = $('.mono', stage);
      if (!el) return;
      var text = el.getAttribute('data-type') || '';
      el.textContent = '';
      var i = 0;
      var t = setInterval(function () {
        i++;
        el.textContent = text.slice(0, i) + (i < text.length ? '|' : '');
        if (i >= text.length) {
          clearInterval(t);
          setTimeout(function () { el.textContent = text; }, 600);
        }
      }, 75);
      timers.push(t);
    }
    if (id === 'charpop') {
      // 글자별 애니메이션은 CSS 가 처리
      var chars = $('.chars', stage);
      if (chars) chars.classList.add('on');
    }
  }

  function observeStages() {
    if (!('IntersectionObserver' in window)) {
      $$('.stage').forEach(function (s) { playStage(s); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !en.target.dataset.played) {
          en.target.dataset.played = '1';
          playStage(en.target);
        }
      });
    }, { threshold: 0.5 });
    $$('#motionGrid .stage').forEach(function (s) { io.observe(s); });
  }

  function copyText(text, btn, msg) {
    function done() {
      if (btn) {
        var old = btn.textContent;
        btn.classList.add('done');
        btn.textContent = '복사됨 ✓';
        setTimeout(function () { btn.classList.remove('done'); btn.textContent = old; }, 1600);
      }
      showToast(msg || '프롬프트를 복사했어요');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }
  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { showToast('복사하지 못했어요. 길게 눌러 복사해 주세요'); }
    document.body.removeChild(ta);
  }

  function renderCombos() {
    $('#comboList').innerHTML = COMBOS.map(function (c) {
      return '<div class="combo" data-combo="' + c.id + '">' +
        '<div class="combo-head"><span class="combo-title">🎬 ' + esc(c.title) + '</span>' +
        '<span class="chip gold">효과 ' + c.steps.length + '개</span></div>' +
        '<p class="fx-desc" style="margin-top:6px">' + esc(c.desc) + '</p>' +
        '<div class="combo-timeline">' + c.steps.map(function (s) {
          return '<span class="tl"><b>' + s.t + '</b> ' + esc(s.label) + '</span>';
        }).join('') + '</div>' +
        '<div class="combo-stage"><div class="stage" data-combo-stage="' + c.id + '">' + c.html + '</div></div>' +
        '<div class="combo-actions">' +
        '<button class="btn primary" type="button" data-combo-play="' + c.id + '">▶ 재생</button>' +
        '<button class="btn copy" type="button" data-combo-copy="' + c.id + '">타임라인 복사</button>' +
        '</div></div>';
    }).join('');

    $$('[data-combo-play]').forEach(function (b) {
      b.addEventListener('click', function () { playCombo(b.getAttribute('data-combo-play')); });
    });
    $$('[data-combo-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var c = COMBOS.find(function (x) { return x.id === b.getAttribute('data-combo-copy'); });
        copyText('[' + c.title + ']\n' + c.prompt, b);
      });
    });
  }

  function playCombo(id) {
    var stage = $('[data-combo-stage="' + id + '"]');
    if (!stage) return;
    var demo = $('.cb', stage);
    if (!demo) return;
    timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    timers = [];
    demo.classList.remove('on', 'on2', 'on3');
    // 초기화
    var num = $('.cb-num', demo);
    if (num) num.textContent = '0';
    void demo.offsetWidth;

    if (id === 'hook') {
      demo.classList.add('on');        // 줌 인 + 자막
      timers.push(setTimeout(function () { demo.classList.add('on2'); }, 1500)); // 형광펜
    } else {
      demo.classList.add('on');        // 와이프
      timers.push(setTimeout(function () {
        demo.classList.add('on2');
        var n = $('.cb-num', demo);
        if (!n) return;
        var target = 12480, start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / 1200, 1);
          n.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('ko-KR');
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }, 800));
      timers.push(setTimeout(function () { demo.classList.add('on3'); }, 2200));
    }
  }

  function renderEsf() {
    $('#esfList').innerHTML = ESF_STYLES.map(function (s) {
      return '<div class="esf"><span class="no">' + s.no + '</span><div><b>' + esc(s.name) + '</b>' +
        '<span>' + esc(s.use) + ' · 추천: ' + esc(s.fx) + '</span></div></div>';
    }).join('');
  }

  /* =========================================================
     7. 공모전·체험단 판
     ========================================================= */
  function renderContestFilters() {
    var filters = ['전체', '공모전', '체험단', '임박(D-7)'];
    $('#contestFilters').innerHTML = filters.map(function (f) {
      return '<button class="filter' + (state.contestFilter === f ? ' is-on' : '') + '" type="button" data-cf="' + f + '">' + f + '</button>';
    }).join('');
    $$('#contestFilters .filter').forEach(function (b) {
      b.addEventListener('click', function () {
        state.contestFilter = b.getAttribute('data-cf');
        save(); renderContestFilters(); renderContest();
      });
    });
  }

  function renderContestStats() {
    var active = state.contests.filter(function (c) { return c.status !== '제외'; });
    var soon = active.filter(function (c) {
      var n = daysUntil(c.due); return n !== null && n >= 0 && n <= 7;
    }).length;
    var applied = active.filter(function (c) {
      return c.status === '신청 완료' || c.status === '발표 대기';
    }).length;
    var waiting = active.filter(function (c) { return c.status === '발표 대기'; }).length;
    $('#contestStats').innerHTML =
      '<div class="stat urgent"><b>' + soon + '</b><span>7일 안 임박</span></div>' +
      '<div class="stat"><b>' + applied + '</b><span>신청·대기</span></div>' +
      '<div class="stat gold"><b>' + waiting + '</b><span>발표 대기</span></div>';
  }

  function renderContest() {
    var list = state.contests.slice();
    if (state.contestFilter === '공모전' || state.contestFilter === '체험단') {
      list = list.filter(function (c) { return c.kind === state.contestFilter; });
    } else if (state.contestFilter === '임박(D-7)') {
      list = list.filter(function (c) {
        var n = daysUntil(c.due);
        return c.status !== '제외' && n !== null && n >= 0 && n <= 7;
      });
    }
    list.sort(function (a, b) {
      var ae = a.status === '제외' ? 1 : 0, be = b.status === '제외' ? 1 : 0;
      if (ae !== be) return ae - be;
      var an = daysUntil(a.due), bn = daysUntil(b.due);
      if (an === null && bn === null) return 0;
      if (an === null) return 1;
      if (bn === null) return -1;
      return an - bn;
    });

    $('#contestCount').textContent = state.contests.length + '건';
    if (!list.length) {
      $('#contestList').innerHTML = '<div class="empty">조건에 맞는 항목이 없어요.</div>';
      return;
    }
    $('#contestList').innerHTML = list.map(function (c) {
      var dd = ddayText(c.due);
      var past = daysUntil(c.due) !== null && daysUntil(c.due) < 0 && c.status !== '제외';
      var kindChip = c.kind === '공모전' ? 'gold' : 'soft';
      var statusChip = c.status === '제외' ? 'dim' : c.status === '신청 완료' ? 'blue' :
        c.status === '발표 대기' ? 'violet' : c.status === '준비 중' ? 'coral' : 'soft';
      return '<article class="contest' + (c.status === '제외' ? ' past' : '') + (past ? ' past' : '') + '" data-cid="' + c.id + '">' +
        '<div class="contest-top"><div><h3 class="contest-title">' + esc(c.title) + '</h3>' +
        '<p class="contest-sub">' + esc(c.org || '') + (c.due ? ' · ' + fmtDate(c.due) + ' ' + esc(c.dueLabel || (c.kind === '체험단' ? '발표' : '마감')) : '') + '</p></div>' +
        '<span class="dday ' + dd.cls + '">' + dd.text + '</span></div>' +
        '<div class="contest-meta"><span class="chip ' + kindChip + '">' + esc(c.kind) + '</span>' +
        '<span class="chip ' + statusChip + '">' + esc(c.status) + '</span></div>' +
        (c.reward ? '<p class="contest-reward">🎁 ' + esc(c.reward) + '</p>' : '') +
        '<textarea class="contest-memo" data-memo="' + c.id + '" rows="2" maxlength="300" aria-label="전략 메모">' + esc(c.memo || '') + '</textarea>' +
        '<div class="contest-foot">' +
        '<select class="status-select" data-status="' + c.id + '" aria-label="상태">' +
        CONTEST_STATUS.map(function (s) {
          return '<option value="' + s + '"' + (s === c.status ? ' selected' : '') + '>' + s + '</option>';
        }).join('') + '</select>' +
        '<div class="right">' +
        (c.url ? '<a class="c-link" href="' + esc(c.url) + '" target="_blank" rel="noopener">바로가기 ↗</a>' : '') +
        '<button class="c-del" type="button" data-cdel="' + c.id + '">지우기</button>' +
        '</div></div>' +
        '</article>';
    }).join('');
    bindContest();
  }

  function bindContest() {
    $$('[data-status]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var c = state.contests.find(function (x) { return x.id === sel.getAttribute('data-status'); });
        if (!c) return;
        c.status = sel.value;
        save(); renderContestStats(); renderContest();
        showToast('상태를 「' + sel.value + '」로 바꿨어요');
      });
    });
    $$('[data-memo]').forEach(function (ta) {
      ta.addEventListener('input', function () {
        var c = state.contests.find(function (x) { return x.id === ta.getAttribute('data-memo'); });
        if (!c) return;
        c.memo = ta.value;
        save();
      });
      ta.addEventListener('blur', function () { showToast('메모를 저장했어요'); });
    });
    $$('[data-cdel]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-cdel');
        var idx = state.contests.findIndex(function (x) { return x.id === id; });
        if (idx < 0) return;
        var removed = state.contests.splice(idx, 1)[0];
        if (String(removed.id).charAt(0) === 'c') state.removed.push(removed.id);
        save(); renderContestStats(); renderContest();
        showToast('판에서 지웠어요', function () {
          state.contests.splice(idx, 0, removed);
          state.removed = state.removed.filter(function (r) { return r !== removed.id; });
          save(); renderContestStats(); renderContest();
        });
      });
    });
  }

  function initContestForm() {
    $('#contestForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var title = $('#cTitle').value.trim();
      if (!title) return;
      var url = $('#cUrl').value.trim();
      if (url && !/^https?:\/\//i.test(url)) url = '';
      state.contests.push({
        id: uid(), title: title, org: $('#cOrg').value.trim(),
        kind: $('#cKind').value, due: $('#cDue').value,
        dueLabel: $('#cKind').value === '체험단' ? '발표' : '마감',
        reward: $('#cReward').value.trim(), status: '관심',
        memo: $('#cMemo').value.trim(), url: url
      });
      save();
      $('#contestForm').reset();
      renderContestStats(); renderContest();
      showToast('판에 올렸어요');
    });
  }

  /* =========================================================
     8. 매뉴얼 서랍
     ========================================================= */
  function renderManual() {
    var body = $('#manualBody');
    body.innerHTML = state.manual.map(function (m) {
      return '<div class="m-item" data-mid="' + m.id + '">' +
        '<div class="m-head"><b>' + esc(m.title) + '</b>' +
        '<div class="m-tools">' +
        (m.copy ? '<button class="mini" type="button" data-mcopy="' + m.id + '" aria-label="계좌번호 복사">복사</button>' : '') +
        '<button class="mini" type="button" data-medit="' + m.id + '" aria-label="수정">✎</button>' +
        '<button class="mini del" type="button" data-mdel="' + m.id + '" aria-label="삭제">✕</button>' +
        '</div></div>' +
        '<p class="m-text">' + accountText(m.text) + '</p>' +
        '</div>';
    }).join('') || '<div class="empty">매뉴얼이 비었어요.</div>';

    $$('[data-mcopy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var m = state.manual.find(function (x) { return x.id === b.getAttribute('data-mcopy'); });
        copyText(m.copy, b);
      });
    });
    $$('[data-medit]').forEach(function (b) {
      b.addEventListener('click', function () { editManual(b.getAttribute('data-medit')); });
    });
    $$('[data-mdel]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-mdel');
        var idx = state.manual.findIndex(function (x) { return x.id === id; });
        if (idx < 0) return;
        var removed = state.manual.splice(idx, 1)[0];
        if (String(removed.id).charAt(0) === 'm') state.removed.push(removed.id);
        save(); renderManual();
        showToast('매뉴얼을 지웠어요', function () {
          state.manual.splice(idx, 0, removed);
          state.removed = state.removed.filter(function (r) { return r !== removed.id; });
          save(); renderManual();
        });
      });
    });
  }

  function editManual(id) {
    var m = state.manual.find(function (x) { return x.id === id; });
    if (!m) return;
    var item = $('[data-mid="' + id + '"]');
    var textEl = $('.m-text', item);
    item.classList.add('editing');
    textEl.outerHTML =
      '<div class="m-edit"><input type="text" value="' + esc(m.title) + '" maxlength="40" aria-label="매뉴얼 제목">' +
      '<textarea rows="3" maxlength="400" aria-label="매뉴얼 내용">' + esc(m.text) + '</textarea>' +
      '<div class="row"><button class="btn primary small" type="button" data-msave="' + id + '">저장</button>' +
      '<button class="btn ghost small" type="button" data-mcancel="' + id + '">취소</button></div></div>';
    $('[data-msave="' + id + '"]').addEventListener('click', function () {
      var t = $('.m-edit input', item).value.trim();
      var x = $('.m-edit textarea', item).value.trim();
      if (!t || !x) return;
      m.title = t; m.text = x;
      save(); renderManual(); showToast('매뉴얼을 고쳤어요');
    });
    $('[data-mcancel="' + id + '"]').addEventListener('click', renderManual);
  }

  function initManualForm() {
    $('#manualForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var t = $('#manualTitleInput').value.trim();
      var x = $('#manualTextInput').value.trim();
      if (!t || !x) return;
      state.manual.push({ id: uid(), title: t, text: x, copy: '' });
      save();
      $('#manualTitleInput').value = '';
      $('#manualTextInput').value = '';
      renderManual();
      showToast('매뉴얼에 추가했어요');
    });
    $('#manualReset').addEventListener('click', function () {
      var before = state.manual;
      state.manual = DEFAULT_MANUAL.map(function (m) {
        return { id: uid(), title: m.title, text: m.text, copy: m.copy || '' };
      });
      save(); renderManual();
      showToast('기본 매뉴얼로 되돌렸어요', function () {
        state.manual = before; save(); renderManual();
      });
    });
  }

  function openManual() { renderManual(); openSheet('#manualSheet'); }

  /* =========================================================
     8-B. 현황 배지 · 축 · 루틴
     ========================================================= */
  function renderSync() {
    var t = $('#syncTime');
    if (t) t.textContent = SYNCED_AT;
    var m = $('#syncMeta');
    if (m) m.textContent = '축 ' + AXES.length + '개 · 루틴 ' + ROUTINES.length + '개 가동 · 보관 ' + state.archive.length + '건';
  }

  function renderAxes() {
    var box = $('#axes');
    if (!box) return;
    box.innerHTML = AXES.map(function (a) {
      return '<article class="axis" data-axis="' + a.id + '">' +
        '<div class="axis-head"><span class="axis-ico" aria-hidden="true">' + a.icon + '</span>' +
        '<div class="axis-txt"><b>' + esc(a.name) + '</b><span>' + esc(a.sub) + '</span></div></div>' +
        '<span class="chip ' + a.tone + '">' + esc(a.state) + '</span>' +
        '<p class="axis-detail">' + esc(a.detail) + '</p>' +
        '<div class="axis-tools">' +
        (a.href ? '<a class="mini go" href="' + esc(a.href) + '" target="_blank" rel="noopener">열기 ↗</a>' : '') +
        (a.path ? '<button class="mini" type="button" data-copyaxis="' + a.id + '">경로 복사</button>' : '') +
        '</div></article>';
    }).join('');
    $$('[data-copyaxis]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-copyaxis');
        var a = AXES.filter(function (x) { return x.id === id; })[0];
        if (a) copyText(a.path, b, '경로를 복사했어요');
      });
    });
    var n = $('#axisCount');
    if (n) n.textContent = AXES.length + '개';
  }

  function renderRoutines() {
    var box = $('#routines');
    if (!box) return;
    box.innerHTML = ROUTINES.map(function (r) {
      return '<div class="routine">' +
        '<span class="r-time">' + esc(r.time) + '</span>' +
        '<div class="r-main"><b>' + esc(r.name) + '</b><span>' + esc(r.note) + '</span></div>' +
        '<span class="r-days">' + esc(r.days) + '</span>' +
        '</div>';
    }).join('');
    var off = $('#routinesOff');
    if (off) {
      off.textContent = PAUSED_ROUTINES.length
        ? '⏸ 지금은 꺼 둔 루틴 ' + PAUSED_ROUTINES.length + '개 — ' + PAUSED_ROUTINES.join(' · ')
        : '';
      off.hidden = !PAUSED_ROUTINES.length;
    }
    var n = $('#routineCount');
    if (n) n.textContent = '가동 ' + ROUTINES.length + ' · 정지 ' + PAUSED_ROUTINES.length;
  }

  /* =========================================================
     8-B-2. 📅 주간 일정표 (매일 공통 + 월~일 + 날짜 확인)
     ========================================================= */
  var DAY_EN = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  var DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];
  var wdayFilter = '전체';

  function todayKey() { return DAY_EN[new Date().getDay()]; }
  function dayKoOf(iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return isNaN(d.getTime()) ? '' : DAY_KO[d.getDay()];
  }

  function renderWeekly() {
    /* ① 매일 공통 */
    var dbox = $('#weeklyDaily');
    if (dbox) {
      dbox.innerHTML = WEEKLY_DAILY.map(function (s) {
        return '<div class="wdaily">' +
          '<span class="wtime">' + esc(s.time) + '</span>' +
          '<div class="wdaily-main"><b>' + esc(s.name) + '</b><span>' + esc(s.note) + '</span></div>' +
          '</div>';
      }).join('');
    }
    var dc = $('#weeklyDailyCount');
    if (dc) dc.textContent = WEEKLY_DAILY.length + '개';

    /* ② 월~일 — 요일 칩으로 한 요일만 볼 수 있음 */
    var tk = todayKey();
    var chips = $('#weeklyChips');
    if (chips) {
      chips.innerHTML = ['전체'].concat(WEEKLY_DAYS.map(function (d) { return d.day; })).map(function (d) {
        var on = wdayFilter === d;
        var isToday = d !== '전체' && d === DAY_KO[new Date().getDay()];
        return '<button class="filter' + (on ? ' is-on' : '') + (isToday ? ' is-today' : '') + '" type="button"' +
          ' data-wday="' + d + '"' + (isToday ? ' aria-current="date"' : '') + '>' + d + (isToday ? '·오늘' : '') + '</button>';
      }).join('');
      $$('[data-wday]').forEach(function (b) {
        b.addEventListener('click', function () {
          wdayFilter = b.getAttribute('data-wday');
          renderWeekly();
        });
      });
    }

    var wbox = $('#weeklyDays');
    if (wbox) {
      wbox.innerHTML = WEEKLY_DAYS.filter(function (d) {
        return wdayFilter === '전체' || d.day === wdayFilter;
      }).map(function (d) {
        var isToday = d.key === tk;
        var body = d.items.length
          ? '<ul class="wday-list">' + d.items.map(function (it) {
            return '<li><span class="wtime">' + esc(it.time) + '</span>' +
              '<div><b>' + esc(it.name) + '</b>' + (it.note ? '<span class="wd-note">' + esc(it.note) + '</span>' : '') + '</div></li>';
          }).join('') + '</ul>'
          : '<p class="wday-empty">매일 공통 시간표만 돕니다.</p>';
        return '<article class="wday' + (isToday ? ' is-today' : '') + '" data-weekday="' + d.key + '">' +
          '<div class="wday-head"><b>' + esc(d.day) + '요일</b>' +
          (isToday ? '<span class="twoday">오늘</span>' : '') +
          '<span class="wday-n">' + d.items.length + '개</span></div>' + body + '</article>';
      }).join('');
    }
    var wc = $('#weeklyDayCount');
    if (wc) wc.textContent = wdayFilter === '전체' ? WEEKLY_DAYS.length + '일' : wdayFilter + '요일';

    /* ③ 날짜가 정해진 확인 */
    var bbox = $('#weeklyDates');
    if (bbox) {
      var list = WEEKLY_DATES.slice().sort(function (a, b) {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
      });
      bbox.innerHTML = list.map(function (w) {
        var dd = ddayText(w.date);
        var p = String(w.date).split('-');
        var past = dd.cls === 'done' && dd.text === '지남';
        return '<div class="wdate' + (past ? ' is-past' : '') + '">' +
          '<span class="wd-date">' + p[1] + '-' + p[2] + '<em>(' + dayKoOf(w.date) + ')</em></span>' +
          '<div class="wd-main"><b>' + esc(w.name) + '</b><span>' + esc(w.time) +
          (w.note ? ' · ' + esc(w.note) : '') + '</span></div>' +
          '<span class="dday ' + dd.cls + '">' + dd.text + '</span></div>';
      }).join('');
    }
    var bc = $('#weeklyDateCount');
    if (bc) bc.textContent = WEEKLY_DATES.length + '건';

    var mc = $('#weeklyCount');
    if (mc) mc.textContent = '매일 ' + WEEKLY_DAILY.length + ' · 요일별 ' + WEEKLY_DAYS.length + '일';
  }

  /* =========================================================
     8-C. 보관실 (아카이브)
     ========================================================= */
  var OWNER_CAT = {
    content: '블로그·티스토리', shorts: '유튜브', market: '마켓',
    campaign: '공모전·문서', asset: '블로그·티스토리', contest: '공모전·문서', leader: '웹앱'
  };
  function catForOwner(owner) { return OWNER_CAT[owner] || '공모전·문서'; }

  function dateLong(iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return iso || '날짜 없음';
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    if (isNaN(d.getTime())) return iso;
    var wd = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    return p[0] + '-' + p[1] + '-' + p[2] + ' (' + wd + ')';
  }

  function archiveFiltered() {
    var q = String(state.archiveQuery || '').trim().toLowerCase();
    var list = state.archive.filter(function (a) {
      if (state.archiveCat !== '전체' && a.cat !== state.archiveCat) return false;
      if (!q) return true;
      return [a.title, a.note, a.date, a.url, a.path, a.cat].join(' ').toLowerCase().indexOf(q) >= 0;
    });
    list.sort(function (x, y) {
      if (x.date !== y.date) return x.date < y.date ? 1 : -1;
      return 0;
    });
    return list;
  }

  function archCard(a) {
    var tone = a.cat === '웹앱' ? 'soft' : a.cat === '유튜브' ? 'coral' :
      a.cat === '마켓' ? 'gold' : a.cat === '공모전·문서' ? 'violet' :
      a.cat === '논문·성분' ? 'sci' : 'blue';
    return '<article class="arch" data-aid="' + a.id + '">' +
      '<div class="arch-top"><span class="chip ' + tone + '">' + esc(a.cat) + '</span>' +
      '<button class="mini del" type="button" data-adel="' + a.id + '" aria-label="보관 항목 지우기">✕</button></div>' +
      '<h3 class="arch-title">' + esc(a.title) + '</h3>' +
      (a.note ? '<p class="arch-note">' + esc(a.note) + '</p>' : '') +
      (a.url ? '<p class="arch-link">' + esc(a.url) + '</p>' : '') +
      (a.path ? '<p class="arch-path"><code>' + esc(a.path) + '</code></p>' : '') +
      '<div class="arch-tools">' +
      (a.url ? '<a class="btn open" href="' + esc(a.url) + '" target="_blank" rel="noopener">바로 열기 ↗</a>' : '') +
      (a.path ? '<button class="btn copy" type="button" data-acopy="' + a.id + '">경로 복사</button>' : '') +
      '</div></article>';
  }

  function renderArchiveCats() {
    var counts = {};
    ARCH_CATS.forEach(function (c) { counts[c] = 0; });
    counts['전체'] = state.archive.length;
    state.archive.forEach(function (a) { if (counts[a.cat] != null) counts[a.cat]++; });
    var box = $('#archCats');
    if (!box) return;
    box.innerHTML = ARCH_CATS.map(function (c) {
      return '<button class="filter' + (state.archiveCat === c ? ' is-on' : '') + '" type="button" data-acat="' + c + '">' +
        c + ' ' + counts[c] + '</button>';
    }).join('');
    $$('#archCats .filter').forEach(function (b) {
      b.addEventListener('click', function () {
        state.archiveCat = b.getAttribute('data-acat');
        save(); renderArchiveCats(); renderArchiveList();
      });
    });
    var n = $('#archCount');
    if (n) n.textContent = state.archive.length + '건';
  }

  function renderArchiveList() {
    var box = $('#archList');
    if (!box) return;
    var inp = $('#archSearch');
    if (inp && inp.value !== state.archiveQuery) inp.value = state.archiveQuery;

    var list = archiveFiltered();
    if (!list.length) {
      box.innerHTML = '<div class="empty">조건에 맞는 보관 항목이 없어요. 검색어를 지우거나 분야를 「전체」로 바꿔 보세요.</div>';
      return;
    }
    var html = '', last = '';
    list.forEach(function (a) {
      if (a.date !== last) {
        last = a.date;
        var n = list.filter(function (x) { return x.date === a.date; }).length;
        html += '<div class="arch-day"><b>' + esc(dateLong(a.date)) + '</b><span>' + n + '건</span></div>';
      }
      html += archCard(a);
    });
    html += '<p class="board-help">보관 ' + list.length + '건 표시 중 · 전체 ' + state.archive.length + '건</p>';
    box.innerHTML = html;

    $$('[data-acopy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = state.archive.filter(function (x) { return x.id === b.getAttribute('data-acopy'); })[0];
        if (a) copyText(a.path, b, '경로를 복사했어요');
      });
    });
    $$('[data-adel]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-adel');
        var idx = state.archive.findIndex(function (x) { return x.id === id; });
        if (idx < 0) return;
        var removed = state.archive.splice(idx, 1)[0];
        if (String(removed.id).charAt(0) === 'a') state.removed.push(removed.id);
        save(); renderArchiveAll();
        showToast('보관실에서 지웠어요', function () {
          state.archive.splice(idx, 0, removed);
          state.removed = state.removed.filter(function (r) { return r !== removed.id; });
          save(); renderArchiveAll();
        });
      });
    });
  }

  function renderArchiveAll() {
    renderArchiveCats();
    renderArchiveList();
    renderSync();
  }

  function initArchiveForm() {
    var d = $('#aDate');
    if (d) d.value = todayISO();
    $('#archSearch').addEventListener('input', function (e) {
      state.archiveQuery = e.target.value;
      save(); renderArchiveList();
    });
    $('#archClear').addEventListener('click', function () {
      state.archiveQuery = '';
      state.archiveCat = '전체';
      $('#archSearch').value = '';
      save(); renderArchiveCats(); renderArchiveList();
      showToast('검색과 분야를 초기화했어요');
    });
    $('#archForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var title = $('#aTitle').value.trim();
      if (!title) return;
      var url = $('#aUrl').value.trim();
      if (url && !/^https?:\/\//i.test(url)) url = '';
      state.archive.unshift({
        id: uid(),
        date: $('#aDate').value || todayISO(),
        cat: $('#aCat').value,
        title: title,
        note: $('#aNote').value.trim(),
        url: url,
        path: $('#aPath').value.trim()
      });
      save();
      $('#aTitle').value = ''; $('#aUrl').value = ''; $('#aPath').value = ''; $('#aNote').value = '';
      state.archiveCat = '전체'; state.archiveQuery = '';
      renderArchiveAll();
      showToast('보관실에 넣었어요');
    });
  }

  /* =========================================================
     9. 서랍 열고 닫기
     ========================================================= */
  var lastFocus = null;
  function openSheet(sel) {
    lastFocus = document.activeElement;
    var el = $(sel);
    el.hidden = false;
    var first = $('button, input, textarea, select', el);
    if (first) setTimeout(function () { first.focus(); }, 40);
  }
  function closeSheet(sel) {
    var el = $(sel);
    if (!el) return;
    el.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* =========================================================
     10. 시작
     ========================================================= */
  function init() {
    state = load();

    renderToday();
    renderSync();
    renderAxes();
    renderRoutines();
    renderWeekly();
    renderOffice();
    renderStats();
    renderBoard();
    initTaskForm();

    renderMotionFilters();
    renderMotion();
    renderCombos();
    renderEsf();

    renderContestFilters();
    renderContestStats();
    renderContest();
    initContestForm();

    initArchiveForm();
    renderArchiveCats();
    renderArchiveList();

    initManualForm();

    switchView(state.view);
    save(); // v1 저장본을 v2 키로 옮기고, 채운 기본값을 바로 기록

    $$('.tab').forEach(function (b) {
      b.addEventListener('click', function () { switchView(b.getAttribute('data-view')); });
    });
    $('#manualBtn').addEventListener('click', openManual);

    $$('.sheet').forEach(function (sheet) {
      $$('[data-close]', sheet).forEach(function (b) {
        b.addEventListener('click', function () { closeSheet('#' + sheet.id); });
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        $$('.sheet').forEach(function (s) { if (!s.hidden) closeSheet('#' + s.id); });
        hideToast();
      }
    });

    // 서비스 워커 (http 로 열렸을 때만)
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(function () { /* 오프라인 캐시는 없어도 동작 */ });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
