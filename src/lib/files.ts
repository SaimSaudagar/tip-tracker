import type { DocumentPickerAsset } from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export type FileKind = { mimeType: string; uti: string };
export const CSV: FileKind = { mimeType: 'text/csv', uti: 'public.comma-separated-values-text' };
export const JSON_FILE: FileKind = { mimeType: 'application/json', uti: 'public.json' };

/** Renders HTML to a PDF named `fileName` and opens the share sheet (email, print, save to Files…). */
export async function sharePdf(html: string, fileName: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  const target = new File(Paths.cache, fileName);
  if (target.exists) target.delete();
  await new File(uri).move(target);
  await Sharing.shareAsync(target.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: fileName });
}

/** Writes a text file to the cache folder and opens the share sheet (save to Files, email, AirDrop…). */
export async function shareTextFile(fileName: string, contents: string, kind: FileKind): Promise<void> {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  await file.write(contents);
  await Sharing.shareAsync(file.uri, { mimeType: kind.mimeType, UTI: kind.uti, dialogTitle: fileName });
}

export async function readPickedFile(asset: DocumentPickerAsset): Promise<string> {
  return new File(asset.uri).text();
}
