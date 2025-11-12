function TaiToanBoTaiLieuHSBAV2() {
    if (window.location.hostname !== 'hsba.tahospital.vn') return;

    // Load pdf-lib for merging using the same loading pattern as PDF.js
    const getPDFLib = () => (window.PDFLib || (typeof unsafeWindow !== 'undefined' ? unsafeWindow.PDFLib : undefined));
    if (!getPDFLib()) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
        script.referrerPolicy = 'no-referrer';
        script.onload = () => {
            try {
                // bridge between page and userscript contexts
                if (typeof unsafeWindow !== 'undefined' && unsafeWindow.PDFLib && !window.PDFLib) {
                    try { window.PDFLib = unsafeWindow.PDFLib; } catch(_) {}
                }
                console.log('PDF-lib loaded for HSBA download');
            } catch(_) {}
        };
        script.onerror = () => console.warn('Failed to load PDF-lib, falling back to individual downloads');
        document.head.appendChild(script);
    }

    // Listen for the existing HSBA data fetch result
    window.addEventListener('message', (event) => {
        try {
            const data = event.data;
            if (data && data.type === 'DR_HSBA_RESULT' && data.payload && data.payload.data && data.payload.data.hoSoBenhAns) {
                // Store data globally for manual trigger
                window.hsbaData = data.payload;
                console.log('HSBA data ready for manual download');
            }
        } catch (e) {
            console.error('Error processing HSBA message:', e);
        }
    });

    // Also check if data is already available (in case it was fetched before this script ran)
    if (window.__dr_hsba_result__ && window.__dr_hsba_result__.data && window.__dr_hsba_result__.data.hoSoBenhAns) {
        window.hsbaData = window.__dr_hsba_result__;
        console.log('HSBA data already available for manual download');
    }
}

function downloadAllDocuments(data) {
    if (!data || !data.data || !data.data.hoSoBenhAns || !data.data.hoSoBenhAns.items) {
        console.error('Invalid data structure for hoSoBenhAns');
        return;
    }

    const items = data.data.hoSoBenhAns.items;
    const filteredDocs = [];
    const downloadPromises = [];

    // Filter documents based on tenmau keywords
    const keywords = ['phiếu khám', 'kết quả', 'chuyên khoa', 'dị ứng', 'tiền mê', 'duyệt mổ', 'cam đoan', 'điều trị'];

    items.forEach(item => {
        if (item.hoSoChiTiet) {
            item.hoSoChiTiet.forEach(section => {
                if (section.chiTiets) {
                    section.chiTiets.forEach(doc => {
                        if (doc.tenfile && doc.tenmau && doc.ngay) {
                            // Check if tenmau contains any of the keywords (case insensitive)
                            const tenmauLower = doc.tenmau.toLowerCase();
                            const hasKeyword = keywords.some(keyword => tenmauLower.includes(keyword));
                            
                            if (hasKeyword) {
                                filteredDocs.push({
                                    ...doc,
                                    patientInfo: {
                                        hoten: item.hoten,
                                        mabn: item.mabn
                                    }
                                });
                                
                                // Prepare for downloading with proper filename
                                const fileName = `${doc.tenmau} - ${formatDate(doc.ngay)}.pdf`;
                                downloadPromises.push(downloadDocumentForMerge(doc.tenfile, fileName));
                            }
                        }
                    });
                }
            });
        }
    });

    // Wait for all downloads to complete, then process results
    Promise.allSettled(downloadPromises).then((results) => {
        const successfulDownloads = results
            .map((result, index) => ({
                result,
                doc: filteredDocs[index]
            }))
            .filter(({ result }) => result.status === 'fulfilled' && result.value);

        // Always download individual files with correct names
        successfulDownloads.forEach(({ result, doc }) => {
            const fileName = `${doc.tenmau} - ${formatDate(doc.ngay)}.pdf`;
            downloadDocumentWithCorrectName(result.value, fileName);
        });

        // Try to merge PDFs if pdf-lib is available and we have multiple files
        const getPDFLib = () => (window.PDFLib || (typeof unsafeWindow !== 'undefined' ? unsafeWindow.PDFLib : undefined));
        if (successfulDownloads.length > 1 && getPDFLib()) {
            console.log(`Attempting to merge ${successfulDownloads.length} PDFs...`);
            const pdfBuffers = successfulDownloads.map(({ result }) => result.value);
            mergeAndDownloadPDFs(pdfBuffers, filteredDocs[0]?.patientInfo);
        } else if (successfulDownloads.length > 1 && !getPDFLib()) {
            console.log('PDF-lib not available, skipping merge. Only individual files downloaded.');
        } else {
            console.log(`Only ${successfulDownloads.length} file(s) found, no merging needed.`);
        }

        // Call the hide function after downloads
        if (typeof HSBAV2HideEmptySectionsIfNeeded === 'function') {
            HSBAV2HideEmptySectionsIfNeeded();
        }
    });
}

function downloadDocumentForMerge(tenfile, fileName) {
    const url = 'https://hsba.tahospital.vn/api/hosobenhan/download/base64?url=' + encodeURIComponent(tenfile);
    return fetch(url, { credentials: 'include' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to download ' + fileName);
            }
            return response.json();
        })
        .then(jsonResponse => {
            const base64String = jsonResponse.base64;
            
            // Decode base64 to binary
            const binaryString = atob(base64String);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Return the PDF buffer for merging
            return bytes.buffer;
        })
        .catch(err => {
            console.error('Error downloading document ' + fileName + ':', err);
            return null; // Return null so Promise.allSettled can handle it
        });
}

function downloadDocumentWithCorrectName(buffer, fileName) {
    try {
        const blob = new Blob([buffer], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        // Create download link and trigger download
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clean up
        URL.revokeObjectURL(blobUrl);
        
        console.log('Downloaded:', fileName);
    } catch (err) {
        console.error('Error downloading document ' + fileName + ':', err);
    }
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateString; // Return original if parsing fails
    }
}

async function mergeAndDownloadPDFs(pdfBuffers, patientInfo) {
    const getPDFLib = () => (window.PDFLib || (typeof unsafeWindow !== 'undefined' ? unsafeWindow.PDFLib : undefined));
    if (!getPDFLib() || !pdfBuffers.length) {
        console.log('PDF-lib not available or no buffers to merge');
        return;
    }

    try {
        console.log(`Starting PDF merge with ${pdfBuffers.length} files...`);
        const { PDFDocument } = getPDFLib();
        const mergedPdf = await PDFDocument.create();

        for (let i = 0; i < pdfBuffers.length; i++) {
            try {
                const pdf = await PDFDocument.load(pdfBuffers[i]);
                const pageCount = pdf.getPageCount();
                console.log(`Processing PDF ${i + 1}: ${pageCount} pages`);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach(page => mergedPdf.addPage(page));
            } catch (e) {
                console.error(`Error processing PDF ${i + 1}:`, e);
            }
        }

        const mergedPdfBytes = await mergedPdf.save();
        const totalPages = mergedPdf.getPageCount();
        console.log(`Merged PDF created with ${totalPages} total pages`);
        
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        // Create download link for merged PDF
        const fileName = patientInfo ? `${patientInfo.hoten}-${patientInfo.mabn}.pdf` : 'merged-hsba-documents.pdf';
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clean up
        URL.revokeObjectURL(blobUrl);
        
        console.log(`✅ Merged PDF downloaded as: ${fileName}`);
    } catch (e) {
        console.error('❌ Error merging PDFs:', e);
    }
}

// Export for require
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TaiToanBoTaiLieuHSBAV2, triggerDownloadIfDataExists, downloadDocumentForMerge, downloadDocumentWithCorrectName, formatDate, mergeAndDownloadPDFs };
}

function triggerDownloadIfDataExists() {
    if (window.hsbaData) {
        downloadAllDocuments(window.hsbaData);
    } else {
        alert('Dữ liệu chưa sẵn sàng. Vui lòng tải lại trang hoặc chờ dữ liệu tải.');
    }
}