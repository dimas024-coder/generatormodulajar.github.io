import { GoogleGenAI, Type } from "@google/genai";
import { FormData } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateModulAjar = async (data: FormData): Promise<any> => {
  const meetingDetails = data.meetings.map(m => `
    Pertemuan ${m.meetingNumber}:
    - Mode Tujuan: ${m.objectiveMode}
    - Tujuan Manual: ${m.objectiveText || '-'}
    - Pendekatan/Model: ${m.pedagogy}
  `).join('\n');

  const profileDimensions = data.graduateProfile.join(', ');

  // Determine CP instruction based on mode
  const cpInstruction = data.cpMode === 'manual' && data.cpText.trim() !== ''
    ? `Gunakan teks Capaian Pembelajaran (CP) berikut secara verbatim (jangan diubah sama sekali): "${data.cpText}"`
    : `Tuliskan CP umum yang sesuai untuk Mapel ${data.subject} Fase ${data.phase} berdasarkan regulasi kurikulum merdeka terbaru.`;

  const prompt = `
    Bertindaklah sebagai Konsultan Pendidikan Ahli Kurikulum Merdeka dan Deep Learning (Mindful, Meaningful, Joyful).
    Tugasmu adalah membuat "Modul Ajar / Rencana Pembelajaran Mendalam (RPM)" lengkap dan terstruktur.

    INFORMASI INPUT:
    - Nama Sekolah: ${data.schoolName}
    - Kepala Sekolah: ${data.headmasterName}
    - Nama Penyusun: ${data.teacherName}
    - Mata Pelajaran: ${data.subject}
    - Fase: ${data.phase}
    - Kelas: ${data.className}
    - Semester: ${data.semester}
    - Topik: ${data.topic}
    - Alokasi Waktu: ${data.timeAllocation}
    - Jumlah Pertemuan: ${data.meetingCount}
    - Tahun Pelajaran: ${data.academicYear}
    - Dimensi Profil Pelajar Pancasila: ${profileDimensions}
    - Detail Strategi Pertemuan: ${meetingDetails}

    INSTRUKSI FORMAT OUTPUT (WAJIB JSON):
    Kamu harus menghasilkan output JSON yang valid dengan skema yang ditentukan. Setiap properti berisi string HTML (bukan Markdown). Gunakan Tailwind CSS classes atau inline styles untuk tabel agar rapi.

    DETAIL INSTRUKSI KONTEN PER BAGIAN:

    1. BAGIAN IDENTITAS (sectionA_Identity):
       Buat tabel HTML berisi data identitas di atas.

    2. BAGIAN IDENTIFIKASI (sectionB_Identification):
       a. Kesiapan Peserta Didik:
          - Deskripsi naratif singkat tentang pengetahuan awal dan gaya belajar.
          - Hasil asesmen diagnostik kognitif (Sangat Mahir, Mahir, Kurang Mahir).
          - **WAJIB BUAT TABEL PEMETAAN** dengan kolom: "Profil Kemampuan Peserta Didik", "Diferensiasi Konten", "Diferensiasi Proses", "Diferensiasi Produk".
          - Isi tabel harus relevan dengan TOPIK: "${data.topic}". JANGAN gunakan contoh sejarah Mesir kecuali topiknya itu.
          - Contoh logika tabel:
            * Sangat Mahir: Analisis mendalam/HOTS, sumber kompleks, produk analitis kritis.
            * Mahir: Analisis terbimbing, sumber standar, produk analitis standar.
            * Perlu Bimbingan: Scaffolding intensif, materi dasar/visual, produk deskriptif.
       b. Karakteristik Materi: Analisis singkat (esensial/aplikatif).
       c. Dimensi Profil Lulusan: Deskripsi implementasi dimensi terpilih.

    3. BAGIAN DESAIN PEMBELAJARAN (sectionC_Design):
       a. Capaian Pembelajaran (CP): ${cpInstruction}
       b. Topik Kontekstual: Hubungkan topik dengan kehidupan nyata.
       c. Integrasi Lintas Disiplin: Sebutkan mapel lain yang terkait.
       d. Tujuan Pembelajaran (Per Pertemuan):
          - Jika mode 'auto', buat Tujuan Pembelajaran dengan rumus ABCD (Audience, Behavior, Condition, Degree).
          - Contoh: "Peserta didik (A) mampu menganalisis X (B) melalui diskusi (C) dengan tepat (D)".
          - Gunakan Kata Kerja Operasional (Bloom).
       e. Kerangka Pembelajaran:
          - Jelaskan integrasi Mindful, Meaningful, Joyful.
          - Kemitraan & Lingkungan Belajar.
          - Pemanfaatan Digital (Saran tools: Kahoot, Quizizz, Canva, dll).

    4. BAGIAN PENGALAMAN BELAJAR (sectionD_LearningExperience):
       Buat rincian langkah pembelajaran UNTUK SETIAP PERTEMUAN (${data.meetingCount} pertemuan).
       Format per pertemuan:
       - **AWAL**: Orientasi bermakna, Apersepsi, Motivasi Joyful.
       - **INTI**:
         - Ikuti SINTAKS RESMI model pembelajaran yang dipilih (misal: ${data.meetings[0].pedagogy}).
         - Jelaskan aktivitas Guru dan Siswa.
         - Masukkan Diferensiasi (Kelompok A/B/C) di langkah yang relevan.
         - Tandai integrasi Deep Learning (Contoh: "(Mindful Learning)").
       - **PENUTUP**: Refleksi, Umpan balik.
       - Deskripsi holistik pengalaman belajar (Memahami, Mengaplikasi, Refleksi).

    5. BAGIAN ASESMEN (sectionE_Assessment):
       - Asesmen Awal, Proses (Formatif), Akhir (Sumatif).
       - **KKTP (Kriteria Ketercapaian Tujuan Pembelajaran)**: Buat Tabel Rubrik dengan kategori: Perlu Bimbingan, Cukup, Baik, Sangat Baik.

    6. BAGIAN LKPD (sectionF_LKPD):
       Buat rancangan LKPD terpisah untuk 3 level (Sangat Mahir, Mahir, Perlu Bimbingan).
       Setiap LKPD berisi: Tujuan, Petunjuk, Aktivitas, Pertanyaan HOTS, Refleksi.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-09-2025', // Or specific stable model
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sectionA_Identity: { type: Type.STRING, description: "HTML table string for Identity" },
          sectionB_Identification: { type: Type.STRING, description: "HTML content string for Identification" },
          sectionC_Design: { type: Type.STRING, description: "HTML content string for Design" },
          sectionD_LearningExperience: { type: Type.STRING, description: "HTML content string for Learning Experience steps" },
          sectionE_Assessment: { type: Type.STRING, description: "HTML content string for Assessment & KKTP" },
          sectionF_LKPD: { type: Type.STRING, description: "HTML content string for LKPD attachments" },
        },
        required: [
          "sectionA_Identity",
          "sectionB_Identification",
          "sectionC_Design",
          "sectionD_LearningExperience",
          "sectionE_Assessment",
          "sectionF_LKPD"
        ]
      }
    }
  });

  return JSON.parse(response.text);
};