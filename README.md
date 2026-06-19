# 인천 동북권 통합돌봄 ICP 플랫폼

심뇌혈관질환(협심증·AMI·뇌경색) 대상자를 위한 **지역 통합돌봄 케어 플랜(ICP)
표준화 + AI 에이전트 시스템** 프로토타입과 설계 산출물 모음.

## 개요

- **목표**: 입원~퇴원~지역연계로 이어지는 통합돌봄 경로(ICP)를 표준화하고,
  AI 에이전트가 사례관리사·의료진을 보조하도록 한다.
- **표준화**: 국제표준 **FHIR(R4)** 위에 한국 전송표준 **KR Core**를 깔고,
  그 위에 ICP 전용 프로파일(CarePlan·PlanDefinition 등)을 정의한다.
- **연계**: 환자 과거 의료이력은 **건강정보 고속도로**(KR Core 기반)에서
  동의 기반으로 수집하고, 돌봄 평가(ADL·인지·가족지원)는 자체 수집한다.

## 아키텍처 요약

- **멀티 에이전트**: 케어 코디네이터(오케스트레이터) + 데이터 수집 · 경로 추천 ·
  위험 감시 · 자원 매칭 · 소통 에이전트.
- **격리**: 에이전트마다 컨테이너(Docker/K8s)로 분리, `NetworkPolicy`로 egress
  최소화, SMART on FHIR 백엔드 스코프로 권한 최소화.
- **안전 원칙**: 에이전트는 **제안**만 하고, 임상 분기·환자 접촉·공식 케어플랜
  기록은 사람(사례관리사·의료진)의 승인 게이트를 거친다.
- **데이터 파이프라인**: silo 소스 → 수집(배치+스트림) → 표준화(FHIR 매핑 ·
  ConceptMap · `$validate` · 환자식별) → Canonical FHIR 저장소 → 에이전트.

## 저장소 구조

```
icp-care-platform/
├── README.md                  이 문서
├── .gitignore
├── app/                       프런트엔드 프로토타입
│   └── icp_care_platform.jsx     ICP 모니터링/퇴원관리 React 앱
├── deploy/                    배포 매니페스트 (데이터 수집 에이전트 예시)
│   ├── networkpolicy-agent-intake.yaml   egress 최소화 (표준 + Cilium FQDN)
│   └── smart-client-agent-intake.json    SMART 백엔드 클라이언트 등록(스코프 최소화)
└── ig/                        Implementation Guide 섹션
    └── icp-ig-highway-mapping.md  건강정보 고속도로 12종 → FHIR 리소스 매핑
```

## 시작하기 (GitHub 푸시)

```bash
git init
git add .
git commit -m "Initial commit: ICP care platform"
git branch -M main
git remote add origin https://github.com/<USER>/<REPO>.git
git push -u origin main
```

> `app/icp_care_platform.jsx`는 단일 컴포넌트 프로토타입입니다. 실제 실행 시
> Vite/Next.js 등 프로젝트에 편입하고 의존성(React, lucide-react 등)을 설치하세요.

## 면책

본 프로토타입과 AI 권장 경로는 **임상적 의사결정을 대체하지 않습니다.**
모든 진단·치료·전원 결정은 자격을 갖춘 의료진의 판단에 따릅니다.
