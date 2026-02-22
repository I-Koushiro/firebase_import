import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

const serviceAccount = JSON.parse(
  fs.readFileSync("./secret/secret-key.json", "utf-8")
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

type Week = {
  date: string; // "YYYY-MM-DD"
  actual_price: number;
  predicted_price: number;
};

type MarketEntry = {
  market_name: string;
  weeks?: Week[]; // 配列（各要素が map/object）
};

type CropEntry = {
  crop_name: string;
  markets?: MarketEntry[];
};

function normalizeWeeks(input: unknown): Week[] {
  if (!Array.isArray(input)) return [];

  return input.map((w, idx) => {
    if (typeof w !== "object" || w === null) {
      throw new Error(`weeks[${idx}] must be an object`);
    }

    const date = (w as any).date;
    const actual = Number((w as any).actual_price);
    const predicted = Number((w as any).predicted_price);

    if (typeof date !== "string" || !date) {
      throw new Error(`weeks[${idx}].date must be a non-empty string`);
    }
    if (!Number.isFinite(actual) || !Number.isFinite(predicted)) {
      throw new Error(`weeks[${idx}].actual_price and predicted_price must be numbers`);
    }

    return {
      date,
      actual_price: actual,
      predicted_price: predicted,
    };
  });
}

async function importMarketJson(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  if (!data.market || !Array.isArray(data.market)) {
    throw new Error('JSON must have an array: { "market": [ ... ] }');
  }

  for (const crop of data.market as CropEntry[]) {
    if (!crop?.crop_name || typeof crop.crop_name !== "string") {
      throw new Error("Each crop entry must have crop_name (string).");
    }

    // 親: market コレクション（自動ID）
    const cropRef = await db.collection("market").add({
      crop_name: crop.crop_name,
    });
    console.log(`Created market/${cropRef.id} (crop_name=${crop.crop_name})`);

    // markets サブコレクション
    const markets = Array.isArray(crop.markets) ? crop.markets : [];
    for (const mkt of markets) {
      if (!mkt?.market_name || typeof mkt.market_name !== "string") {
        throw new Error("Each market entry must have market_name (string).");
      }

      // weeks を「配列フィールド」として格納（要素は map/object）
      const weeks = normalizeWeeks(mkt.weeks);

      await cropRef.collection("markets").add({
        market_name: mkt.market_name,
        weeks,
      });

      console.log(
        `  Imported market_name=${mkt.market_name} (weeks=${weeks.length})`
      );
    }
  }
}

(async () => {
  try {
    const filePath = path.join(process.cwd(), "data", "user.json");
    await importMarketJson(filePath);
    console.log("Import completed!");
  } catch (err) {
    console.error("Import error:", err);
    process.exitCode = 1;
  }
})();