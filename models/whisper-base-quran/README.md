# Quran speech model (runs on the phone)

`tarteel-ai/whisper-base-ar-quran` by Tarteel AI, a fine-tune of OpenAI's
`whisper-base` on Quran recitation. Apache License 2.0 (see LICENSE).

Changes made to the original work (Apache-2.0 §4b):
1. Exported to ONNX (merged decoder with past key values) — export taken from
   `forgers20/tarteel-ai-onnx-whisper-base-ar-quran`.
2. Encoder: matrix multiplications quantized to int8 (dynamic, weights only).
3. Decoder: token-embedding matrix stored as int8 with a per-row scale and
   de-quantized when the model loads; matrix multiplications quantized to int8.
4. `generation_config.json` taken from `openai/whisper-tiny` (Apache-2.0) via
   `emadjumaah/mishkat-whisper-tiny-ar-quran-onnx`, for the language tokens.
No retraining; the weights are otherwise unchanged.
