
export default function CertificateCard({ certificate }) {
  return (
    <div className="card p-6 border-2 border-primary-100 dark:border-primary-900/30 bg-gradient-to-br from-primary-50 to-white dark:from-primary-950/20 dark:to-dark-800">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
          <HiAcademicCap className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-dark-900 dark:text-white">{certificate?.courseName || 'Course Certificate'}</h3>
          <p className="text-sm text-dark-500 mt-1">Completed on {certificate?.completedAt ? new Date(certificate.completedAt).toLocaleDateString() : 'N/A'}</p>
          <p className="text-xs text-dark-400 mt-1">Certificate ID: {certificate?._id || certificate?.certificateId || 'N/A'}</p>
        </div>
        <button className="btn-outline text-sm flex items-center gap-1">
          <HiDownload className="h-4 w-4" />
          Download
        </button>
      </div>
    </div>
  );
}
