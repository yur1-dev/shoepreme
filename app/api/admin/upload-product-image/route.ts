import { NextRequest, NextResponse } from "next/server";
import {
  getStagedUploadUrl,
  attachImageToProduct,
  deleteProductMedia,
} from "@/lib/shopify-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const productId = formData.get("productId") as string;
  const oldMediaId = formData.get("oldMediaId") as string | null;

  if (!file || !productId) {
    return NextResponse.json({
      success: false,
      error: "Missing file or productId",
    });
  }

  const staged = await getStagedUploadUrl(file.name, file.type, file.size);
  if (!staged.success) return NextResponse.json(staged);

  const uploadForm = new FormData();
  for (const param of staged.target.parameters) {
    uploadForm.append(param.name, param.value);
  }
  uploadForm.append("file", file);

  const uploadRes = await fetch(staged.target.url, {
    method: "POST",
    body: uploadForm,
  });
  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    return NextResponse.json({
      success: false,
      error: `Upload failed: ${text}`,
    });
  }

  const attached = await attachImageToProduct(
    productId,
    staged.target.resourceUrl,
  );
  if (!attached.success) return NextResponse.json(attached);

  if (oldMediaId) {
    await deleteProductMedia(productId, [oldMediaId]); // best-effort, ignore failure
  }

  return NextResponse.json({ success: true, media: attached.media });
}
