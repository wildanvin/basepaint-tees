import "server-only";

import { readFile } from "node:fs/promises";
import { generatedAssetPaths } from "@/lib/print-assets";
import type { PrintfulMockupUrls } from "@/lib/printful";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const buckets = {
  frontPrintUrl: "print-files",
  backPrintUrl: "print-files",
  mockupFrontUrl: "mockups",
  mockupBackUrl: "mockups",
} as const;

const contentTypes = {
  frontPrintUrl: "image/png",
  backPrintUrl: "image/png",
  mockupFrontUrl: "image/png",
  mockupBackUrl: "image/png",
} as const;

export async function uploadGeneratedAssets(basepaintDay: number, version: string) {
  const supabase = getSupabaseAdmin();
  const paths = generatedAssetPaths(basepaintDay);
  const urls: Record<keyof typeof buckets, string> = {
    frontPrintUrl: "",
    backPrintUrl: "",
    mockupFrontUrl: "",
    mockupBackUrl: "",
  };

  for (const key of Object.keys(buckets) as Array<keyof typeof buckets>) {
    const bucket = buckets[key];
    const storagePath = `basepaint-${basepaintDay}/${version}/${paths[key].filename}`;
    const file = await readFile(paths[key].filePath);
    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file, {
        contentType: contentTypes[key],
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload ${storagePath}: ${error.message}`);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    urls[key] = data.publicUrl;
  }

  return urls;
}

async function uploadRemoteImage({
  bucket,
  storagePath,
  imageUrl,
}: {
  bucket: string;
  storagePath: string;
  imageUrl: string;
}) {
  const response = await fetch(imageUrl, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to download Printful mockup: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const file = Buffer.from(await response.arrayBuffer());
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(bucket).upload(storagePath, file, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload ${storagePath}: ${error.message}`);
  }

  return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
}

export async function uploadPrintfulMockups(
  basepaintDay: number,
  urls: PrintfulMockupUrls,
  version: string,
) {
  const uploaded: {
    mockupFrontUrl?: string;
    mockupBackUrl?: string;
  } = {};

  if (urls.front) {
    uploaded.mockupFrontUrl = await uploadRemoteImage({
      bucket: "mockups",
      storagePath: `basepaint-${basepaintDay}/${version}/printful_mockup_front.jpg`,
      imageUrl: urls.front,
    });
  }

  if (urls.back) {
    uploaded.mockupBackUrl = await uploadRemoteImage({
      bucket: "mockups",
      storagePath: `basepaint-${basepaintDay}/${version}/printful_mockup_back.jpg`,
      imageUrl: urls.back,
    });
  }

  return uploaded;
}
