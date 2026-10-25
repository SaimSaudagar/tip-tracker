import type { DocumentPickerAsset } from 'expo-document-picker';

/** On web the report opens in a new tab with the browser's print dialog (which can save as PDF). */
export async function sharePdf(html: string, _fileName: string): Promise<void> {
  const win = window.open('', '_blank');
  if (!win) throw new Error('Allow pop-ups for this site to print the report.');
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

/** Web has no share sheet for local files, so the CSV is downloaded instead. */
export async function shareCsvFile(fileName: string, contents: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readPickedFile(asset: DocumentPickerAsset): Promise<string> {
  if (asset.file) return asset.file.text();
  return (await fetch(asset.uri)).text();
}
