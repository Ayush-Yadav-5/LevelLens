import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  FileCheck, 
  Building2, 
  Award, 
  Calendar,
  Share2
} from 'lucide-react';
import { Student, FLNCompetency } from '../types';

interface OfficialReportModalProps {
  students: Student[];
  competencies: FLNCompetency[];
  onClose: () => void;
}

export const OfficialReportModal: React.FC<OfficialReportModalProps> = ({
  students,
  competencies,
  onClose,
}) => {
  const totalStudents = students.length;
  const gradeLevelReading = students.filter(s => s.readingLevel === 'GRADE_LEVEL').length;
  const preWordReading = students.filter(s => s.readingLevel === 'PRE_WORD').length;
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const headers = ['RollNo', 'Name', 'Grade', 'Gender', 'ReadingLevel', 'ReadingWPM', 'ReadingAccuracy', 'MathLevel', 'MathLatencySec', 'ReadingPod', 'MathPod'];
    const rows = students.map(s => [
      s.rollNo,
      `"${s.name}"`,
      s.grade,
      s.gender,
      s.readingLevel,
      s.readingWpm,
      `${s.readingAccuracy}%`,
      s.mathLevel,
      (s.mathLatencyMs / 1000).toFixed(1),
      s.readingPodId,
      s.mathPodId
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NIPUN_FLN_Report_Govt_School_4_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white text-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto border border-slate-300">
        {/* Top Control Bar (Screen Only) */}
        <div className="bg-slate-900 text-white p-3.5 px-6 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Official NIPUN Bharat FLN Compliance Summary</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[80vh] print:max-h-none print:p-0">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase font-mono">
                MINISTRY OF EDUCATION • GOVERNMENT OF INDIA
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                NIPUN BHARAT MISSION — FLN AUDIT REPORT
              </h2>
              <p className="text-xs text-slate-600">
                Foundational Literacy & Numeracy (FLN) Diagnostic & Cohort Progress
              </p>
            </div>

            <div className="text-right text-xs text-slate-600 space-y-0.5 font-mono">
              <div><span className="font-bold">UDISE+ Code:</span> 08120304912</div>
              <div><span className="font-bold">School:</span> GPS #4 (Jaipur East)</div>
              <div><span className="font-bold">Date:</span> {dateStr}</div>
            </div>
          </div>

          {/* High-Level Compliance Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-slate-300 bg-slate-50 text-center">
              <span className="text-[11px] text-slate-500 uppercase font-bold block">Total Enrolled Audited</span>
              <span className="text-2xl font-black text-slate-900 font-mono">{totalStudents}</span>
              <span className="text-[10px] text-slate-500 block">Grades 2 to 4</span>
            </div>

            <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50 text-center">
              <span className="text-[11px] text-emerald-700 uppercase font-bold block">At/Above Grade Benchmark</span>
              <span className="text-2xl font-black text-emerald-800 font-mono">
                {Math.round((gradeLevelReading / totalStudents) * 100)}%
              </span>
              <span className="text-[10px] text-emerald-600 block">{gradeLevelReading} Learners fluent</span>
            </div>

            <div className="p-3 rounded-lg border border-rose-300 bg-rose-50 text-center">
              <span className="text-[11px] text-rose-700 uppercase font-bold block">Critical Intervention Pod</span>
              <span className="text-2xl font-black text-rose-800 font-mono">
                {Math.round((preWordReading / totalStudents) * 100)}%
              </span>
              <span className="text-[10px] text-rose-600 block">{preWordReading} in Sound Sleuths</span>
            </div>
          </div>

          {/* NIPUN Bharat FLN Indicators Audit Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 font-mono">
              FLN Competency Master Checklist
            </h4>
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2.5 font-mono">Code</th>
                    <th className="p-2.5">Domain</th>
                    <th className="p-2.5">Competency Description</th>
                    <th className="p-2.5 font-mono">FLN Benchmark</th>
                    <th className="p-2.5 text-right font-mono">% Achieved</th>
                    <th className="p-2.5 text-center">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {competencies.map(comp => (
                    <tr key={comp.code} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-800">{comp.code}</td>
                      <td className="p-2.5 font-semibold">{comp.domain}</td>
                      <td className="p-2.5 text-slate-600">{comp.description}</td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-500">{comp.benchmark}</td>
                      <td className="p-2.5 font-mono font-bold text-right text-slate-800">{comp.achievedPercent}%</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          comp.status === 'On Track'
                            ? 'bg-emerald-100 text-emerald-800'
                            : comp.status === 'In Progress'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {comp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Teacher Attestation & Verification Block */}
          <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-800">Assessing Teacher Declaration:</p>
              <p className="mt-1 text-[11px] leading-relaxed">
                I certify that foundational micro-assessments have been conducted via stealth oral diagnostics without student test anxiety. Remediation pods have been dynamically established with zero syllabus lag.
              </p>
              <div className="mt-6 border-b border-slate-400 w-48" />
              <p className="text-[10px] text-slate-500 mt-1">Class Teacher Signature</p>
            </div>

            <div className="text-right">
              <p className="font-semibold text-slate-800">Cluster Resource Center (CRC) Stamp:</p>
              <div className="mt-8 border border-dashed border-slate-400 p-3 rounded text-center text-slate-400 text-[10px] font-mono inline-block">
                OFFICIAL VERIFICATION STAMP
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
