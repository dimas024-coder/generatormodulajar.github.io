import React, { useState, useRef } from 'react';
import { 
  FormData, 
  INITIAL_FORM_DATA, 
  GeneratedResponse, 
  GRADUATE_PROFILES, 
  PEDAGOGY_OPTIONS, 
  MeetingPlan 
} from './types';
import { generateModulAjar } from './services/geminiService';

declare var html2pdf: any;

function App() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedResponse | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMeetingCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const count = parseInt(e.target.value);
    const newMeetings: MeetingPlan[] = [];
    for (let i = 0; i < count; i++) {
      // Preserve existing data if available, otherwise default
      if (formData.meetings[i]) {
        newMeetings.push(formData.meetings[i]);
      } else {
        newMeetings.push({
          meetingNumber: i + 1,
          objectiveMode: 'auto',
          objectiveText: '',
          pedagogy: 'Discovery Learning'
        });
      }
    }
    setFormData(prev => ({
      ...prev,
      meetingCount: count,
      meetings: newMeetings
    }));
  };

  const handleMeetingDetailChange = (index: number, field: keyof MeetingPlan, value: string) => {
    const updatedMeetings = [...formData.meetings];
    updatedMeetings[index] = { ...updatedMeetings[index], [field]: value };
    setFormData(prev => ({ ...prev, meetings: updatedMeetings }));
  };

  const handleProfileChange = (profile: string) => {
    setFormData(prev => {
      const exists = prev.graduateProfile.includes(profile);
      if (exists) {
        return { ...prev, graduateProfile: prev.graduateProfile.filter(p => p !== profile) };
      } else {
        return { ...prev, graduateProfile: [...prev.graduateProfile, profile] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacherName || !formData.subject || !formData.topic) {
      alert("Mohon lengkapi data wajib (Nama Guru, Mapel, Topik)");
      return;
    }

    setLoading(true);
    try {
      const data = await generateModulAjar(formData);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat membuat modul. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!contentRef.current) return;
    
    // Sanitize filename to prevent errors with special characters
    const safeSubject = formData.subject.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
    const safeTopic = formData.topic.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
    
    const element = contentRef.current;
    
    const opt = {
      margin: [10, 10, 15, 10], // Top, Left, Bottom, Right (mm)
      filename: `Modul_Ajar_${safeSubject}_${safeTopic}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      enableLinks: true,
      html2canvas: { 
        scale: 2, // Higher scale for better text quality
        useCORS: true,
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      // Important: Configuration to respect CSS page breaks and avoid cutting text
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Show processing state if needed, here we just call save
    html2pdf().set(opt).from(element).save().catch((err: any) => {
      console.error("PDF Download Error:", err);
      alert("Gagal mengunduh PDF. Silakan coba lagi.");
    });
  };

  const handleCopyToDocs = async () => {
    if (!contentRef.current) return;
    try {
      const htmlContent = contentRef.current.innerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([contentRef.current.innerText], { type: 'text/plain' });
      
      const item = new ClipboardItem({
        'text/html': blob,
        'text/plain': textBlob
      });
      
      await navigator.clipboard.write([item]);
      
      const confirm = window.confirm("Konten telah disalin ke clipboard! Tekan OK untuk membuka Google Docs baru, lalu tekan CTRL+V untuk menempel.");
      if (confirm) {
        window.open('https://docs.new', '_blank');
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('Gagal menyalin ke clipboard. Izin browser mungkin dibatasi.');
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-blue-900 text-white p-6 shadow-md print:hidden">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold">Aplikasi Generate Modul Ajar by Dimas Faldi</h1>
          <p className="opacity-90">SMK Analis Kesehatan Jember - Generator Perencanaan Pembelajaran Mendalam (RPM)</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6">
        
        {/* Input Form */}
        <section className={`bg-white rounded-lg shadow-lg p-6 mb-8 border border-gray-200 ${result ? 'hidden print:hidden' : 'block'}`}>
          <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">Input Data Modul Ajar</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* A. Identitas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sekolah</label>
                    <input 
                      type="text" name="schoolName" value={formData.schoolName} onChange={handleInputChange}
                      className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500" required
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kepala Sekolah</label>
                    <input 
                      type="text" name="headmasterName" value={formData.headmasterName} onChange={handleInputChange}
                      className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500" placeholder="Nama Kepala Sekolah beserta gelar"
                    />
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">NUPTK Kepala Sekolah</label>
                      <input 
                        type="text" name="headmasterNuptk" value={formData.headmasterNuptk} onChange={handleInputChange}
                        className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Nomor NUPTK Kepsek"
                      />
                    </div>
                 </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Penyusun (Guru)</label>
                    <input 
                      type="text" name="teacherName" value={formData.teacherName} onChange={handleInputChange}
                      className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500" required placeholder="Nama Guru beserta gelar"
                    />
                    <div className="mt-2">
                       <label className="block text-xs font-medium text-gray-500 mb-1">NUPTK Guru</label>
                       <input 
                         type="text" name="teacherNuptk" value={formData.teacherNuptk} onChange={handleInputChange}
                         className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Nomor NUPTK Guru"
                       />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                    <input 
                      type="text" name="subject" value={formData.subject} onChange={handleInputChange}
                      className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500" required
                    />
                 </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
                  <select name="phase" value={formData.phase} onChange={handleInputChange} className="w-full border rounded-md p-2">
                    <option value="E">E</option>
                    <option value="F">F</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                  <select name="className" value={formData.className} onChange={handleInputChange} className="w-full border rounded-md p-2">
                    <option value="X">X</option>
                    <option value="XI">XI</option>
                    <option value="XII">XII</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select name="semester" value={formData.semester} onChange={handleInputChange} className="w-full border rounded-md p-2">
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Topik Materi</label>
                <input 
                  type="text" name="topic" value={formData.topic} onChange={handleInputChange}
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Ikatan Kimia" required
                />
              </div>
              
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alokasi Waktu</label>
                    <select name="timeAllocation" value={formData.timeAllocation} onChange={handleInputChange} className="w-full border rounded-md p-2">
                      <option value="2 x 45 menit">2 x 45 menit</option>
                      <option value="3 x 45 menit">3 x 45 menit</option>
                      <option value="4 x 45 menit">4 x 45 menit</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Pelajaran</label>
                    <input 
                      type="text" name="academicYear" value={formData.academicYear} onChange={handleInputChange}
                      className="w-full border rounded-md p-2"
                    />
                 </div>
              </div>
            </div>

            {/* Capaian Pembelajaran (CP) Input */}
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <label className="block text-sm font-medium text-blue-900 mb-2">Capaian Pembelajaran (CP)</label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="cpMode"
                    value="auto"
                    checked={formData.cpMode === 'auto'}
                    onChange={handleInputChange}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Generate Otomatis (AI)</span>
                </label>
                <label className="flex items-center text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="cpMode"
                    value="manual"
                    checked={formData.cpMode === 'manual'}
                    onChange={handleInputChange}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Input Manual</span>
                </label>
              </div>
              
              {formData.cpMode === 'manual' && (
                <div className="animate-fade-in">
                  <textarea
                    name="cpText"
                    value={formData.cpText}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-3 focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={4}
                    placeholder="Salin teks Capaian Pembelajaran (CP) resmi dari kurikulum di sini..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    *Teks CP ini akan digunakan secara verbatim (apa adanya) dalam modul ajar.
                  </p>
                </div>
              )}
            </div>

            {/* Profil Pelajar Pancasila */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Dimensi Profil Lulusan (Pilih 3-5)</label>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                 {GRADUATE_PROFILES.map(profile => (
                   <label key={profile} className="flex items-center space-x-2 text-sm">
                     <input 
                       type="checkbox" 
                       checked={formData.graduateProfile.includes(profile)}
                       onChange={() => handleProfileChange(profile)}
                       className="rounded text-blue-600 focus:ring-blue-500"
                     />
                     <span>{profile}</span>
                   </label>
                 ))}
               </div>
            </div>

            {/* Detail Pertemuan */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Detail Pertemuan</h3>
                <div>
                   <label className="text-sm font-medium mr-2">Jumlah Pertemuan:</label>
                   <select 
                    value={formData.meetingCount} 
                    onChange={handleMeetingCountChange}
                    className="border rounded-md p-1"
                   >
                     {[1, 2, 3, 4, 5].map(n => (
                       <option key={n} value={n}>{n} Pertemuan</option>
                     ))}
                   </select>
                </div>
              </div>

              <div className="space-y-4">
                {formData.meetings.map((meeting, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-md border">
                    <h4 className="font-medium text-blue-800 mb-2">Pertemuan {meeting.meetingNumber}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Model Pembelajaran (Pedagogis)</label>
                        <select 
                          value={meeting.pedagogy}
                          onChange={(e) => handleMeetingDetailChange(idx, 'pedagogy', e.target.value)}
                          className="w-full border rounded-md p-2 text-sm"
                        >
                          {PEDAGOGY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tujuan Pembelajaran</label>
                        <div className="flex gap-2 mb-2">
                          <label className="flex items-center text-xs">
                             <input 
                               type="radio" name={`mode-${idx}`} 
                               checked={meeting.objectiveMode === 'auto'}
                               onChange={() => handleMeetingDetailChange(idx, 'objectiveMode', 'auto')}
                               className="mr-1"
                             /> Otomatis (AI)
                          </label>
                          <label className="flex items-center text-xs">
                             <input 
                               type="radio" name={`mode-${idx}`} 
                               checked={meeting.objectiveMode === 'manual'}
                               onChange={() => handleMeetingDetailChange(idx, 'objectiveMode', 'manual')}
                               className="mr-1"
                             /> Manual
                          </label>
                        </div>
                        {meeting.objectiveMode === 'manual' && (
                          <textarea 
                            value={meeting.objectiveText}
                            onChange={(e) => handleMeetingDetailChange(idx, 'objectiveText', e.target.value)}
                            placeholder="Tulis tujuan pembelajaran..."
                            className="w-full border rounded-md p-2 text-sm"
                            rows={2}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 rounded-md text-white font-bold transition duration-200 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'}`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sedang Meng-generate Modul (AI)...
                </span>
              ) : "GENERATE MODUL AJAR SEKARANG"}
            </button>
          </form>
        </section>

        {/* Result Display */}
        {result && (
          <div className="animate-fade-in">
             <div className="flex flex-wrap gap-4 mb-6 print:hidden sticky top-4 z-10 bg-gray-50 p-2 rounded-lg shadow-sm">
                <button 
                  onClick={() => setResult(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium"
                >
                  &larr; Kembali Edit
                </button>
                <div className="flex-grow"></div>
                <button 
                  onClick={handleCopyToDocs}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium flex items-center"
                >
                  <span className="mr-2">📋</span> Salin & Buka Google Doc
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium flex items-center"
                >
                  <span className="mr-2">📄</span> Download PDF
                </button>
             </div>

             <div 
               ref={contentRef}
               className="bg-white p-8 md:p-12 shadow-2xl rounded-none md:rounded-lg max-w-[210mm] mx-auto min-h-[297mm] prose prose-sm md:prose-base print:shadow-none print:w-full"
             >
                <div className="text-center mb-8 border-b-2 border-black pb-4">
                  <h1 className="text-2xl font-bold uppercase mb-1">Modul Ajar / Rencana Pembelajaran Mendalam</h1>
                  <h2 className="text-xl font-semibold uppercase">{formData.schoolName}</h2>
                </div>

                {/* Content generated by AI */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold bg-gray-100 p-2 border-l-4 border-blue-600 mb-4">A. IDENTITAS MODUL</h3>
                  <div dangerouslySetInnerHTML={{ __html: result.sectionA_Identity }} />
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-bold bg-gray-100 p-2 border-l-4 border-blue-600 mb-4">B. IDENTIFIKASI</h3>
                  <div dangerouslySetInnerHTML={{ __html: result.sectionB_Identification }} />
                </div>

                <div className="mb-8 page-break">
                  <h3 className="text-lg font-bold bg-gray-100 p-2 border-l-4 border-blue-600 mb-4">C. DESAIN PEMBELAJARAN</h3>
                  <div dangerouslySetInnerHTML={{ __html: result.sectionC_Design }} />
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-bold bg-gray-100 p-2 border-l-4 border-blue-600 mb-4">D. PENGALAMAN BELAJAR</h3>
                  <div dangerouslySetInnerHTML={{ __html: result.sectionD_LearningExperience }} />
                </div>

                <div className="mb-8 page-break">
                  <h3 className="text-lg font-bold bg-gray-100 p-2 border-l-4 border-blue-600 mb-4">E. ASESMEN PEMBELAJARAN</h3>
                  <div dangerouslySetInnerHTML={{ __html: result.sectionE_Assessment }} />
                </div>

                <div className="mb-8 page-break">
                  <h3 className="text-lg font-bold bg-gray-100 p-2 border-l-4 border-blue-600 mb-4">F. LAMPIRAN (LKPD)</h3>
                  <div dangerouslySetInnerHTML={{ __html: result.sectionF_LKPD }} />
                </div>

                {/* Footer Signatures */}
                <div className="mt-16 grid grid-cols-2 gap-8 page-break-inside-avoid">
                   <div className="text-center">
                      <p className="mb-20">Mengetahui,<br/>Kepala Sekolah</p>
                      <p className="font-bold underline">{formData.headmasterName || "_________________________"}</p>
                      <p>NUPTK. {formData.headmasterNuptk || "..........................."}</p>
                   </div>
                   <div className="text-center">
                      <p className="mb-20">Jember, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}<br/>Guru Mata Pelajaran</p>
                      <p className="font-bold underline">{formData.teacherName}</p>
                      <p>NUPTK. {formData.teacherNuptk || "..........................."}</p>
                   </div>
                </div>

                <div className="mt-12 pt-4 border-t text-xs text-center text-gray-500 italic">
                  *Modul ajar ini digenerate secara otomatis menggunakan AI Deep Learning App by Dimas Faldi. Silakan disesuaikan dengan kondisi sekolah.
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;