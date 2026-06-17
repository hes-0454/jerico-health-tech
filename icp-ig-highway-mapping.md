# ICP Implementation Guide — 부록 A. 건강정보 고속도로 연계 데이터 매핑

> 인천 동북권 통합돌봄 ICP IG의 한 섹션. 건강정보 고속도로가 제공하는
> 의료기관 표준화 데이터 **12종**을 ICP FHIR 프로파일 리소스로 흘려보내는
> 규칙을 정의한다. 데이터 수집(intake) 에이전트의 구현 기준 문서로 사용한다.

## A.1 적용 원칙

1. **동의 선행**: 어떤 항목도 수집 전 `Consent`(정보제공 동의)를 먼저 확인한다.
   동의가 없거나 철회된 항목은 수집·저장하지 않는다.
2. **KR Core 우선**: 대상 리소스에 KR Core 프로파일이 있으면 그것을 derive 해
   재사용하고, 없으면 base FHIR R4에 ICP 제약(StructureDefinition)을 직접 정의한다.
3. **출처 보존**: 고속도로에서 들어온 리소스는 병원 자체 생성분과 구분하기 위해
   `meta.source`에 고속도로 출처를 표시하고, 수집 행위마다 `Provenance`를 남긴다.
4. **적합성 검증**: 외부 출처 데이터는 ICP 프로파일에 대해 `$validate`를 통과한
   뒤에만 ICP FHIR 서버에 적재한다.
5. **코드 정규화**: 고속도로가 국가표준(FHIR/KR Core 기반)으로 내려주므로 대부분
   그대로 흡수되나, 코드 체계가 ICP ValueSet과 다르면 매핑(ConceptMap)을 적용한다.

## A.2 12종 항목 → FHIR 리소스 매핑

| # | 고속도로 제공항목 | 대상 FHIR 리소스 (프로파일) | 코드 체계 / 매핑 규칙 | ICP에서의 쓰임 |
|---|---|---|---|---|
| 1 | 환자 정보 | `Patient` (KR Core) | 식별자 = 주민·외국인 체계, `address`에 거주지 | 대상자 식별, 부평·계양 권역 판정 |
| 2 | 의료기관 정보 | `Organization` (KR Core) + `Location` | 요양기관기호 | 연계 기관 식별, 자원 매칭 에이전트 입력 |
| 3 | 진료의 정보 | `Practitioner` + `PractitionerRole` | 면허·기관 내 식별자 | CareTeam 구성 |
| 4 | 진단내역 | `Condition` (KR Core) | KCD-8 (+ SNOMED CT 매핑) | **경로 분기 핵심 입력** (협심증/AMI/뇌경색) |
| 5 | 약물처방내역 | `MedicationRequest` + `Medication` (KR Core) | 보험 EDI 약품코드 / ATC | 복약 순응도·상호작용, 위험 감시 에이전트 |
| 6 | 진단검사 | `Observation` (KR Core, laboratory) + `DiagnosticReport` | LOINC | 검사 수치 추세, 재입원 위험도 산출 |
| 7 | 영상검사 | `ImagingStudy` + `DiagnosticReport` | 판독소견 텍스트, 모달리티 코드 | 뇌경색 등 영상 진단 근거 |
| 8 | 병리검사 | `Observation` / `DiagnosticReport` (pathology) | LOINC / SNOMED CT | 진단 보강 |
| 9 | 기타검사 | `Observation` / `DiagnosticReport` (범용) | LOINC, 자체 코드 시 ConceptMap | 보조 지표 |
| 10 | 수술내역 | `Procedure` | 시술코드(EDI / KCD 시술분류) | 과거 PCI·수술력 → 경로·위험 입력 |
| 11 | 알러지 및 부작용 | `AllergyIntolerance` (KR Core) | 알레르기·약물 코드 | 처방·케어플랜 안전성 점검 |
| 12 | 진료기록 | `Encounter` (KR Core) + `DocumentReference`/`Composition`(서술) | 방문일·진료과·종별 | 내원 이력, `EpisodeOfCare`로 묶음 |

## A.3 공공기관 3종 (부가 연계)

| 출처 | 항목 | 대상 FHIR 리소스 | ICP에서의 쓰임 |
|---|---|---|---|
| 국민건강보험공단 | 진료 이력·건강검진 이력 | `Encounter` / `Observation` | 과거 의료이용·검진 기저값 |
| 건강보험심사평가원 | 투약 이력 | `MedicationStatement` | 처방내역과 교차검증, 순응도 |
| 질병관리청 | 예방접종 이력 | `Immunization` | 감염 위험·기저 상태 보강 |

## A.4 매핑 시 주의 — 채워지지 않는 영역

고속도로 12종은 **의료 데이터만** 다룬다. ICP 경로 분기를 좌우하는
**ADL·인지(MMSE)·가족지원·거주형태** 같은 돌봄·복지 평가는 고속도로에서
나오지 않는다. 이 영역은 시군구 통합판정 결과 및 자체 평가로 채우며,
ICP 자체 `Observation`·`RiskAssessment` 프로파일로 표현한다.
즉 고속도로는 "의료 이력 절반"을 표준 규격으로 공급하고, "돌봄 평가 절반"은
ICP IG가 직접 정의한다.

## A.5 데이터 흐름 요약

```
[Consent 확인]
   ↓ (동의된 항목만)
[건강정보 고속도로 12종 / 공공 3종 수신 (FHIR)]
   ↓
[ICP 프로파일 $validate + ConceptMap 정규화]
   ↓
[meta.source·Provenance 부착]
   ↓
[ICP FHIR 서버 적재 → 경로 추천·위험 감시 에이전트 입력]
```
