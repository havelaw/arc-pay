# ArcSplit - Project Context Document

## 프로젝트 개요

**ArcSplit**은 Arc 블록체인 위에서 동작하는 Web3 네이티브 더치페이(bill splitting) dApp입니다.

### 한 줄 요약
> "웹3 카드로 결제하고, 친구에게 USDC 정산 링크를 보내면 끝."

### 핵심 유저 플로우
1. 내가 먼저 웹3 카드(MetaMask Card, RedotPay, KAST 등)로 결제
2. ArcSplit 앱에서 금액/인원 입력 (추후 카드 결제 내역 자동 연동 목표)
3. 앱이 1인당 금액을 자동 계산하고 정산 요청 링크 생성
4. 친구가 링크 클릭 → 지갑 연결 → USDC 송금 → 즉시 정산 완료

---

## 왜 Arc인가? (차별점)

### Arc 블록체인 특성
- **USDC 네이티브 가스**: 가스비를 USDC로 결제. ETH 없이도 트랜잭션 가능. "USDC 보내려는데 가스비용 ETH가 없어" 문제 제거
- **Nanopayments**: $0.000001 단위까지 초소액 결제 가능. 가스비 ~$0.001 고정
- **서브세컨드 파이널리티**: 0.3초 내 트랜잭션 확정. "보냈는데 아직 안 왔어" 없음
- **AI Agent Stack (선택적 확장)**: 추후 AI 에이전트가 결제 내역 자동 파싱 → 더치페이 자동 생성 가능

### 기존 솔루션 대비 장점
| 항목 | 토스/카카오페이 | 기존 크립토 | ArcSplit |
|------|----------------|-------------|----------|
| 글로벌 정산 | 불가 (한국 계좌만) | 가능하지만 가스비 변동 | 가능 + 가스비 고정 |
| 가스비 | 해당없음 | ETH 별도 필요 | USDC로 결제 (추가 토큰 불필요) |
| 정산 속도 | 즉시 | 수초~수분 | 0.3초 |
| 소수점 정밀 분할 | 원 단위 | 가능하지만 가스비 > 금액 위험 | nanopayments로 문제 없음 |

---

## 타겟 유저

- **Primary**: 웹3 네이티브 유저 (크립토 커뮤니티, 해커톤 참석자, DAO 멤버)
- **Secondary**: 웹3 카드 사용자 (RedotPay, KAST 등)
- **Tertiary**: 글로벌 크립토 유저 간 국제 정산

---

## 기술 스택 (제안)

### Frontend
- **Framework**: React (Next.js 또는 Vite)
- **Styling**: Tailwind CSS (라이트 모드, 핀테크 느낌)
- **Fonts**: Outfit (본문) + IBM Plex Mono (숫자/코드)
- **Color Palette**:
  - Primary: Indigo (#6366F1) → Violet (#8B5CF6) 그라디언트
  - Success: Green (#22C55E)
  - Warning: Orange (#F97316)
  - Background: 소프트 그라디언트 (#F0F4FF → #FFF8F0 → #F5F0FF)
  - Cards: 글라스모피즘 (반투명 화이트 + backdrop-blur)

### Blockchain
- **Network**: Arc (Circle의 스테이블코인 네이티브 L1)
- **Token**: USDC (네이티브)
- **Wallet**: MetaMask, Circle Wallet, WalletConnect 등
- **Smart Contract**: Solidity (EVM 호환)
  - SplitRequest 컨트랙트: 정산 요청 생성, 멤버별 결제 상태 추적, 자동 정산

### Backend (선택적)
- 정산 요청 메타데이터 저장 (제목, 멤버 등)
- 링크 단축 서비스
- 푸시 알림 / 리마인더

---

## 스마트 컨트랙트 구조 (초안)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ArcSplit {
    struct Split {
        address creator;        // 결제자 (돈을 받을 사람)
        string title;           // 정산 제목
        uint256 totalAmount;    // 총 금액 (USDC, 6 decimals)
        uint256 perPerson;      // 1인당 금액
        address[] members;      // 정산 대상자들
        mapping(address => bool) paid;  // 결제 여부
        uint256 paidCount;
        bool settled;           // 전원 정산 완료 여부
        uint256 createdAt;
    }

    IERC20 public usdc;
    uint256 public splitCount;
    mapping(uint256 => Split) public splits;

    event SplitCreated(uint256 indexed splitId, address creator, uint256 totalAmount, uint256 memberCount);
    event MemberPaid(uint256 indexed splitId, address member, uint256 amount);
    event SplitSettled(uint256 indexed splitId);

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    function createSplit(
        string calldata _title,
        uint256 _totalAmount,
        address[] calldata _members
    ) external returns (uint256) {
        // _members에는 결제자 본인 제외, 정산 대상자만 포함
        uint256 perPerson = _totalAmount / (_members.length + 1);
        // ... 생성 로직
    }

    function payShare(uint256 _splitId) external {
        // USDC transferFrom으로 결제자에게 직접 송금
        // paid 상태 업데이트
        // 전원 완료 시 SplitSettled 이벤트
    }
}
```

---

## UI/UX 프로토타입 참고

현재 React 프로토타입(arcsplit.jsx)이 존재합니다. 주요 화면:

### 1. 홈 화면
- 잔액 카드 (Indigo 그라디언트, USDC 잔액 표시)
- 받을 돈 / 보낼 돈 요약
- 최근 정산 리스트 (이모지 + 글라스모피즘 카드)
- "새 더치페이" CTA 버튼

### 2. 새 더치페이 생성
- 장소 입력 (자유 텍스트)
- 금액 입력 (원화 입력 → USDC 자동 환산)
- 빠른 금액 선택 (3만/5만/10만/20만)
- 친구 선택 (체크박스, 이모지 아바타)
- 1인당 금액 실시간 프리뷰 (원화 + USDC)
- 예상 가스비 표시 ($0.001)

### 3. 정산 요청 완료
- 성공 애니메이션 (체크마크 + confetti)
- 공유 링크 생성 (arcsplit.xyz/s/...)
- 영수증 (총 금액, 인원, 1인당, USDC 환산)
- Arc 네트워크 정보 (Finality, Gas)

### 4. 미정산 상세 (결제 사이드)
- 정산 현황 (누가 냈고 누가 안 냈는지)
- "USDC 보내기" 버튼
- 결제 완료 시 Tx 영수증

---

## 디자인 가이드라인

### 톤 & 무드
- 밝고 깔끔한 핀테크 스타일 (토스, 레볼루트 참고)
- 라이트 모드 기본
- 친근하면서도 신뢰감 있는 느낌
- 이모지를 적극 활용해 친근함 강화

### 절대 하지 않을 것
- 다크/칙칙한 "크립토 느낌" 테마
- 복잡한 DeFi 용어 노출
- ETH 가스비 걱정하게 만드는 UX
- 과도한 블록체인 전문 용어 (일반 유저도 이해 가능하도록)

### 핵심 UX 원칙
- 원화(₩) 우선 표시, USDC는 보조 환산
- 가스비를 달러로 명확히 표시 ("~$0.001")
- 3단계 이내로 정산 완료
- 링크 하나로 정산 참여 가능 (앱 설치 불필요)

---

## 로드맵 (제안)

### Phase 1: MVP
- [ ] 스마트 컨트랙트 배포 (Arc 테스트넷)
- [ ] 프론트엔드 (React + Wagmi/Viem)
- [ ] 지갑 연결 (MetaMask, WalletConnect)
- [ ] 정산 생성 + 링크 공유 + USDC 결제
- [ ] 기본 정산 히스토리

### Phase 2: Enhancement
- [ ] 웹3 카드 결제 내역 자동 연동 (API 조사 필요)
- [ ] 텔레그램 봇 연동 (그룹에서 바로 정산)
- [ ] 리마인더 알림
- [ ] ENS/온체인 닉네임 지원
- [ ] 다중 통화 지원 (EURC, JPYC via StableFX)

### Phase 3: AI Agent
- [ ] Arc Agent Stack 연동
- [ ] AI가 결제 내역 파싱 → 자동 더치페이 생성
- [ ] 자연어 명령 ("어제 저녁 4명이서 32만원 나눠줘")

---

## 참고 링크

- Arc 공식: https://arc.circle.com
- Circle Developer Docs: https://developers.circle.com
- Arc Agent Stack: Circle Agent Stack 문서 참고
- USDC on Arc: 네이티브 가스 토큰으로 사용
- 프로토타입 코드: arcsplit.jsx (이 프로젝트의 /src 또는 루트에 배치)
