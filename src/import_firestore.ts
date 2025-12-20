import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

const serviceAccount = JSON.parse(
  fs.readFileSync("./secret/secret-key.json", "utf-8")
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function importMarkets(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  if (!data.markets || !Array.isArray(data.markets)) {
    throw new Error("JSON must have an array of markets");
  }

  for (const market of data.markets) {
    const docId = `${market.cropName}_${market.marketName}`;
    const docRef = db.collection("markets").doc(docId);

    const { subCollection, ...mainFields } = market;
    await docRef.set(mainFields);

    if (subCollection?.price && Array.isArray(subCollection.price)) {
      for (const price of subCollection.price) {
        await docRef.collection("price").add(price);
      }
    }
    console.log(`Imported markets/${docId}`);
  }
}

(async () => {
  try {
    const filePath = path.join(process.cwd(), "data", "user.json");
    await importMarkets(filePath);
    console.log("Import completed!");
  } catch (err) {
    console.error("Import error:", err);
  }
})();
