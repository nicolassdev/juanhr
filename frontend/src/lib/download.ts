import api from "./api";

/**
 * Download a file from an authenticated API endpoint.
 * Uses axios (which sends the JWT token) then triggers a browser download.
 */
export async function downloadFile(
  url: string,
  filename: string,
  mimeType: string,
): Promise<void> {
  try {
    const response = await api.get(url, { responseType: "blob" });
    const blob = new Blob([response.data], { type: mimeType });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch (err: any) {
    const msg = err.response?.data?.message || "Download failed";
    alert(msg);
  }
}

export function downloadExcel(
  userId: number | string,
  fullName: string,
  month: string,
  year: string,
) {
  const period = new Date(+year, +month - 1).toLocaleString("en", {
    month: "long",
    year: "numeric",
  });
  const safeName = fullName.replace(/\s+/g, "_");
  return downloadFile(
    `/dtr/export/excel/${userId}?month=${month}&year=${year}`,
    `DTR_${safeName}_${period.replace(/\s/g, "_")}.xlsx`,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}

export function downloadExcelMe(fullName: string, month: string, year: string) {
  const period = new Date(+year, +month - 1).toLocaleString("en", {
    month: "long",
    year: "numeric",
  });
  const safeName = fullName.replace(/\s+/g, "_");
  return downloadFile(
    `/dtr/export/excel/me?month=${month}&year=${year}`,
    `DTR_${safeName}_${period.replace(/\s/g, "_")}.xlsx`,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}

export function downloadPdf(
  userId: number | string,
  fullName: string,
  month: string,
  year: string,
) {
  const period = new Date(+year, +month - 1).toLocaleString("en", {
    month: "long",
    year: "numeric",
  });
  const safeName = fullName.replace(/\s+/g, "_");
  return downloadFile(
    `/dtr/export/pdf/${userId}?month=${month}&year=${year}`,
    `DTR_${safeName}_${period.replace(/\s/g, "_")}.pdf`,
    "application/pdf",
  );
}

export function downloadPdfMe(fullName: string, month: string, year: string) {
  const period = new Date(+year, +month - 1).toLocaleString("en", {
    month: "long",
    year: "numeric",
  });
  const safeName = fullName.replace(/\s+/g, "_");
  return downloadFile(
    `/dtr/export/pdf/me?month=${month}&year=${year}`,
    `DTR_${safeName}_${period.replace(/\s/g, "_")}.pdf`,
    "application/pdf",
  );
}
