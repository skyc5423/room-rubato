# Result explanation correctness

The result pages previously displayed a matched type's fixed `deepAnalysis` as if it described the visitor's exact answers. Those strings asserted particular scenes had all been selected consistently, which cannot be established from a matched type. Both home-room and dedicated-domain results now use the same read-only explanation derived from valid saved axis scores.

The summary names at most two recorded directions furthest from the midpoint, with stable catalogue order for ties. It does not infer exact answers or confidence. Zero-only records receive a centered summary; missing, non-numeric, non-finite or out-of-range scores are excluded. The charts no longer substitute prototype scores for missing personal scores and show missing axes explicitly. Normalized bar positions are described as questionnaire-score positions rather than psychological proportions or probabilities.

Type names remain exploratory labels and curated content remains separate. Economy results explicitly state that the questionnaire is not an investment-suitability/risk assessment or investment recommendation and does not account for personal financial circumstances. Scoring, data/schema, telemetry and persistence are unchanged. No personal responses were accessed for research or testing.

Validation: 171 tests, typecheck and production build passed. New synthetic regressions cover opposing/mixed directions, centered/partial/invalid records, both renderers' removal of fabricated statements, missing-axis behavior and no recording writes. Live browser verification and statistical validation of the questionnaire are not implied.
