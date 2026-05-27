import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { HiLightBulb, HiPhotograph, HiX } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '@/services/api';

export default function AIDoubtSolver() {
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('');
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const controllerRef = useRef(null);
  const token = useSelector((s) => s.auth?.token);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      setImageBase64(base64);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageBase64(null);
    setImagePreview(null);
    fileRef.current.value = '';
    // Abort any ongoing request
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
  };

  const handleSolve = async (e) => {
    e.preventDefault();
    if (!question && !imageBase64) {
      toast.error('Enter a question or upload an image');
      return;
    }
    setLoading(true);
    setAnswer('');
    // Create a fresh abort controller for this request
    const abortCtrl = new AbortController();
    controllerRef.current = abortCtrl;

    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const host = window.location.host;
      const parts = host.split('.');
      let subdomain = null;

      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        if (parts.length > 1 && parts[0] !== 'localhost') {
          subdomain = parts[0];
        }
      } else if (parts.length > 2) {
        if (parts[0] === 'www') subdomain = parts[1];
        else subdomain = parts[0];
      }

      if (subdomain) {
        headers['X-Tenant-Subdomain'] = subdomain;
      } else {
        const devTenantId = import.meta.env.VITE_TENANT_ID;
        const devTenantSubdomain = import.meta.env.VITE_TENANT_SUBDOMAIN;
        if (devTenantId) {
          headers['X-Tenant-Id'] = devTenantId;
        } else if (devTenantSubdomain) {
          headers['X-Tenant-Subdomain'] = devTenantSubdomain;
        }
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/ai/solve-doubt`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ question, subject, imageBase64, stream: true }),
        signal: abortCtrl.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to solve doubt');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let textBuffer = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          textBuffer += decoder.decode(value, { stream: !done });
          const lines = textBuffer.split('\n');
          textBuffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith('data: ')) {
              const jsonStr = cleanLine.substring(6);
              if (jsonStr === '[DONE]') {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.token) {
                  setAnswer((prev) => prev + parsed.token);
                }
              } catch {}
            }
          }
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to solve doubt');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup abort controller on component unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <HiLightBulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            AI Doubt Solver
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ask any question — text or image. Powered by GPT-4o.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSolve}
        className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-100 dark:border-dark-700 p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Subject (optional)
          </label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-600 bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="e.g. Physics, Chemistry, Math"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Your Doubt
          </label>
          <textarea
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-600 bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            placeholder="Type your question here... or upload an image below."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        {/* Image upload */}
        <div>
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Question"
                className="h-40 w-auto rounded-xl border border-slate-200 dark:border-dark-600 object-contain"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center"
              >
                <HiX className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-dark-600 text-sm text-slate-500 dark:text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-colors"
            >
              <HiPhotograph className="h-4 w-4" /> Upload question image (optional)
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImage}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{' '}
              Solving...
            </>
          ) : (
            <>
              <HiLightBulb className="h-4 w-4" /> Solve Doubt
            </>
          )}
        </button>
      </form>

      {answer && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-100 dark:border-dark-700 p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <HiLightBulb className="h-4 w-4 text-amber-500" /> Answer
          </h2>
          <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
}
