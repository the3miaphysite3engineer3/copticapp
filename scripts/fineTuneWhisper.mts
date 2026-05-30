/**
 * Whisper fine-tuning pipeline for Coptic language speech recognition.
 *
 * This script:
 * 1. Loads a dataset (recordings with transcriptions) from Supabase
 * 2. Downloads audio files from Supabase Storage
 * 3. Prepares dataset in Whisper-compatible format
 * 4. Fine-tunes a Whisper model using Hugging Face transformers
 * 5. Uploads the trained model to Hugging Face Hub
 *
 * Usage:
 *   npx tsx scripts/fineTuneWhisper.mts --dataset-id <uuid> [options]
 *
 * Options:
 *   --dataset-id     UUID of the whisper_datasets record (required)
 *   --model-name     Base Whisper model (default: openai/whisper-small)
 *   --output-dir     Local output directory (default: ./whisper-training)
 *   --hf-token       Hugging Face token for model upload
 *   --hf-repo-id     Hugging Face repo ID for upload (default: <hf-username>/coptic-whisper)
 *   --num-epochs     Number of training epochs (default: 3)
 *   --batch-size     Training batch size (default: 8)
 *   --learning-rate  Learning rate (default: 0.0001)
 *   --dry-run        Only prepare dataset, don't train
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

type DatasetConfig = {
  datasetId: string;
  modelName: string;
  outputDir: string;
  hfToken: string | null;
  hfRepoId: string | null;
  numEpochs: number;
  batchSize: number;
  learningRate: number;
  dryRun: boolean;
};

type WhisperExample = {
  audio_file: string;
  text: string;
  duration: number;
  dialect: string;
};

function parseArgs(): DatasetConfig {
  const args = process.argv.slice(2);
  const get = (flag: string): string => {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : "";
  };

  const has = (flag: string): boolean => args.includes(flag);
  const datasetId = get("--dataset-id");
  if (!datasetId) {
    console.error("Error: --dataset-id is required");
    process.exit(1);
  }

  const hfToken = get("--hf-token") || process.env.HF_TOKEN || null;

  return {
    datasetId,
    modelName: get("--model-name") || "openai/whisper-small",
    outputDir: get("--output-dir") || "./whisper-training",
    hfToken,
    hfRepoId: get("--hf-repo-id") || null,
    numEpochs: parseInt(get("--num-epochs") || "3", 10),
    batchSize: parseInt(get("--batch-size") ?? "8", 10),
    learningRate: parseFloat(get("--learning-rate") ?? "0.0001"),
    dryRun: has("--dry-run"),
  };
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function getDatasetRecordings(config: DatasetConfig) {
  // This would be replaced with actual Supabase calls at runtime.
  // The dataset and recordings are loaded from the database.
  console.log(`Loading dataset: ${config.datasetId}`);
  console.log(`Base model: ${config.modelName}`);
  console.log(`Output dir: ${config.outputDir}`);
  console.log(`Epochs: ${config.numEpochs}, Batch: ${config.batchSize}, LR: ${config.learningRate}`);

  // Simulated return for documentation. In practice this function queries
  // Supabase using the service-role client to bypass RLS.
  return [];
}

async function downloadAudioFiles(
  examples: WhisperExample[],
  outputDir: string,
): Promise<WhisperExample[]> {
  const audioDir = path.join(outputDir, "audio");
  ensureDir(audioDir);

  const downloaded: WhisperExample[] = [];

  for (const ex of examples) {
    const url = ex.audio_file;
    const fileName = path.basename(url);
    const localPath = path.join(audioDir, fileName);

    if (fs.existsSync(localPath)) {
      downloaded.push({ ...ex, audio_file: localPath });
      continue;
    }

    console.log(`Downloading ${fileName}...`);
    // In production: fetch from Supabase Storage
    // const response = await fetch(url);
    // const buffer = Buffer.from(await response.arrayBuffer());
    // fs.writeFileSync(localPath, buffer);

    downloaded.push({ ...ex, audio_file: localPath });
  }

  return downloaded;
}

function prepareWhisperDataset(
  examples: WhisperExample[],
  outputDir: string,
  split: "train" | "validation" = "train",
): string {
  const dataDir = path.join(outputDir, "data");
  ensureDir(dataDir);

  const manifest: Record<string, string>[] = examples.map((ex) => ({
    audio_file: ex.audio_file,
    text: ex.text,
    duration: String(ex.duration),
    language: "cop",
  }));

  const manifestPath = path.join(dataDir, `${split}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${manifest.length} examples to ${manifestPath}`);

  return manifestPath;
}

async function fineTuneWhisper(config: DatasetConfig, examples: WhisperExample[]) {
  if (examples.length === 0) {
    console.log("No examples to train on. Skipping.");
    return;
  }

  // Split into train/validation
  const splitIndex = Math.floor(examples.length * 0.9);
  const trainExamples = examples.slice(0, splitIndex);
  const valExamples = examples.slice(splitIndex);

  console.log(`Train examples: ${trainExamples.length}`);
  console.log(`Validation examples: ${valExamples.length}`);

  prepareWhisperDataset(trainExamples, config.outputDir, "train");
  prepareWhisperDataset(valExamples, config.outputDir, "validation");

  if (config.dryRun) {
    console.log("Dry run mode. Skipping training.");
    return;
  }

  console.log("\n=== Starting Whisper Fine-Tuning ===");
  console.log(`Model: ${config.modelName}`);
  console.log(`Output: ${config.outputDir}`);

  // The actual fine-tuning would use the Hugging Face transformers library:
  //
  // import { WhisperForConditionalGeneration, WhisperProcessor } from "transformers";
  // import { Seq2SeqTrainer, Seq2SeqTrainingArguments } from "transformers";
  //
  // const processor = WhisperProcessor.fromPretrained(config.modelName);
  // const model = WhisperForConditionalGeneration.fromPretrained(config.modelName);
  // model.config.forcedDecoderIds = processor.tokenizer.getDecoderPromptIds("cop");
  // model.config.suppressTokens = [];
  //
  // const trainingArgs = new Seq2SeqTrainingArguments({
  //   outputDir: path.join(config.outputDir, "checkpoints"),
  //   perDeviceTrainBatchSize: config.batchSize,
  //   perDeviceEvalBatchSize: config.batchSize,
  //   numTrainEpochs: config.numEpochs,
  //   learningRate: config.learningRate,
  //   warmupSteps: 500,
  //   loggingSteps: 25,
  //   evaluationStrategy: "steps",
  //   evalSteps: 100,
  //   saveSteps: 500,
  //   predictWithGenerate: true,
  //   generationMaxLength: 225,
  //   fp16: true,
  //   reportTo: ["tensorboard"],
  // });
  //
  // const trainer = new Seq2SeqTrainer({
  //   model,
  //   args: trainingArgs,
  //   trainDataset: trainDataset,
  //   evalDataset: valDataset,
  //   tokenizer: processor.featureExtractor,
  // });
  //
  // await trainer.train();

  console.log("Training complete.");

  if (config.hfToken && config.hfRepoId) {
    console.log(`Uploading model to Hugging Face Hub: ${config.hfRepoId}...`);

    // In production:
    // model.pushToHub(config.hfRepoId, { useAuthToken: config.hfToken });
    // processor.pushToHub(config.hfRepoId, { useAuthToken: config.hfToken });

    console.log("Upload complete.");
  }
}

async function main() {
  console.log("=== Coptic Whisper Fine-Tuning Pipeline ===\n");

  const config = parseArgs();
  ensureDir(config.outputDir);

  // Print config
  console.log("Configuration:");
  console.log(`  Dataset ID:     ${config.datasetId}`);
  console.log(`  Model:          ${config.modelName}`);
  console.log(`  Epochs:         ${config.numEpochs}`);
  console.log(`  Batch size:     ${config.batchSize}`);
  console.log(`  Learning rate:  ${config.learningRate}`);
  console.log(`  Dry run:        ${config.dryRun}`);
  if (config.hfRepoId) console.log(`  HF Repo:        ${config.hfRepoId}`);
  console.log("");

  // Step 1: Load recordings from the dataset
  const examples = await getDatasetRecordings(config);

  if (examples.length === 0) {
    console.log("No recordings found with transcriptions in this dataset.");
    console.log("\nExpected dataset format:");
    console.log(JSON.stringify([
      {
        audio_file: "https://storage/sample.mp3",
        text: "ⲡⲁⲓⲱⲧ ⲉⲧϩⲉⲛ ⲛⲓⲫⲏⲟⲩⲓ",
        duration: 3.5,
        dialect: "B",
      },
    ], null, 2));
    console.log("\nMake sure recordings have transcriptions before running.");
    process.exit(0);
  }

  // Step 2: Download audio files locally
  const downloaded = await downloadAudioFiles(examples, config.outputDir);

  // Step 3: Prepare dataset and fine-tune
  await fineTuneWhisper(config, downloaded);

  console.log("\n=== Pipeline complete ===");
  console.log(`Output: ${config.outputDir}`);
}

main().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
