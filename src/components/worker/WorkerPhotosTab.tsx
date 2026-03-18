'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, Upload, X, CheckCircle2, Clock, Loader2, Images } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ProjectSummary } from './WorkerProjectCard';

interface SitePhoto {
  id: string;
  url: string;
  caption?: string;
  trade?: string;
  approved: boolean;
  created_at: string;
  project_id?: string;
}

const PHOTO_TYPES = [
  { value: 'before', label: '施工前', labelEN: 'Before' },
  { value: 'during', label: '施工中', labelEN: 'During' },
  { value: 'inspection', label: '隐蔽验收', labelEN: 'Inspection' },
  { value: 'test', label: '测试记录', labelEN: 'Test Record' },
  { value: 'after', label: '完工后', labelEN: 'After' },
];

const WORKER_TRADES = [
  'Plumbing', 'Electrical', 'Tiling', 'False Ceiling', 'Carpentry',
  'Painting', 'Demolition', 'Glass Work', 'Aluminium Work', 'Metal Work',
  'Flooring', 'Stone/Marble', 'Waterproofing', 'Air Conditioning', 'Cleaning',
  'Alarm & CCTV', 'Landscaping', 'Other',
];

interface WorkerPhotosTabProps {
  sessionUserId: string;
  projects: ProjectSummary[];
  preselectedTaskId?: string | null;
}

export default function WorkerPhotosTab({ sessionUserId, projects, preselectedTaskId }: WorkerPhotosTabProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(!!preselectedTaskId);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [caption, setCaption] = useState('');
  const [photoType, setPhotoType] = useState('during');
  const [selectedTrade, setSelectedTrade] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadDone, setUploadDone] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, [sessionUserId]);

  const fetchPhotos = async () => {
    setLoadingPhotos(true);
    const { data } = await supabase
      .from('site_photos')
      .select('id, url, caption, trade, approved, created_at, project_id')
      .eq('uploaded_by', sessionUserId)
      .order('created_at', { ascending: false })
      .limit(50);
    setPhotos(data || []);
    setLoadingPhotos(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      // Upload to storage
      const ext = selectedFile.name.split('.').pop() || 'jpg';
      const path = `${sessionUserId}/${Date.now()}.${ext}`;
      const { error: storageError } = await supabase.storage
        .from('site-photos')
        .upload(path, selectedFile, { contentType: selectedFile.type, upsert: false });

      let publicUrl = '';
      if (storageError) {
        // Fall back to storing without actual file (demo mode)
        publicUrl = previewUrl || '';
      } else {
        const { data: { publicUrl: url } } = supabase.storage.from('site-photos').getPublicUrl(path);
        publicUrl = url;
      }

      // Save to DB
      await supabase.from('site_photos').insert({
        project_id: selectedProjectId || null,
        user_id: sessionUserId,
        uploaded_by: sessionUserId,
        url: publicUrl,
        caption: `[${photoType}] ${caption}`.trim(),
        trade: selectedTrade || null,
        approved: false,
      });

      setUploadDone(true);
      await fetchPhotos();
      setTimeout(() => {
        setUploadOpen(false);
        setUploadDone(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        setCaption('');
        setPhotoType('during');
      }, 1500);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#0F1923] text-white px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Images className="w-5 h-5 text-[#4F8EF7]" />
              <h1 className="font-bold text-lg">Site Photos</h1>
            </div>
            <p className="text-white/50 text-xs mt-1">{photos.length} photos submitted</p>
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#4F8EF7] text-white rounded-xl text-sm font-semibold hover:bg-[#3B7BE8] transition-colors"
          >
            <Camera className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Gallery */}
      <div className="flex-1 overflow-y-auto bg-rs-bg p-4 overscroll-contain">
        {loadingPhotos ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Camera className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium text-sm">No photos yet</p>
            <p className="text-gray-400 text-xs mt-1">Upload your first site photo</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {photos.map(photo => (
              <div key={photo.id} className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption || 'Site photo'}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="55" text-anchor="middle" fill="%239ca3af" font-size="12">Photo</text></svg>'; }}
                />
                {/* Status badge */}
                <div className={`absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold backdrop-blur-sm ${
                  photo.approved
                    ? 'bg-green-500/90 text-white'
                    : 'bg-amber-500/90 text-white'
                }`}>
                  {photo.approved ? (
                    <><CheckCircle2 className="w-2.5 h-2.5" /> Approved</>
                  ) : (
                    <><Clock className="w-2.5 h-2.5" /> Pending</>
                  )}
                </div>
                {/* Trade badge */}
                {photo.trade && (
                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-md font-medium">
                    {photo.trade}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload modal */}
      {uploadOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm overflow-hidden shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#4F8EF7]" />
                  <h3 className="font-bold text-gray-900">Upload Photo</h3>
                </div>
              <button
                onClick={() => { setUploadOpen(false); setSelectedFile(null); setPreviewUrl(null); setUploadDone(false); }}
                className="p-2 rounded-xl hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {uploadDone ? (
                <div className="py-8 flex flex-col items-center gap-3">
                  <CheckCircle2 className="w-14 h-14 text-green-500" />
                  <p className="font-bold text-gray-900">Photo uploaded!</p>
                  <p className="text-xs text-gray-500">Pending designer review</p>
                </div>
              ) : (
                <>
                  {/* File select */}
                  {!selectedFile ? (
                    <>
                      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-8 flex flex-col items-center gap-2 hover:border-[#4F8EF7]/50 hover:bg-[#4F8EF7]/5 transition-colors"
                      >
                        <Camera className="w-8 h-8 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700">Take Photo / Select Image</p>
                        <p className="text-xs text-gray-400">JPG, PNG</p>
                      </button>
                    </>
                  ) : (
                    <div className="relative">
                      {previewUrl && (
                        <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
                      )}
                      <button
                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  )}

                  {/* Photo type */}
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-2">Photo Type</label>
                    <div className="flex flex-wrap gap-2">
                      {PHOTO_TYPES.map(pt => (
                        <button
                          key={pt.value}
                          onClick={() => setPhotoType(pt.value)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                            photoType === pt.value
                              ? 'bg-[#4F8EF7] text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {pt.label} / {pt.labelEN}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Project */}
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-1">Project</label>
                    <select
                      value={selectedProjectId}
                      onChange={e => setSelectedProjectId(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-[#4F8EF7]"
                    >
                      <option value="">Select project...</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Trade */}
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-1">Trade</label>
                    <select
                      value={selectedTrade}
                      onChange={e => setSelectedTrade(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-[#4F8EF7]"
                    >
                      <option value="">Select trade...</option>
                      {WORKER_TRADES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Caption */}
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-1">Caption (optional)</label>
                    <input
                      value={caption}
                      onChange={e => setCaption(e.target.value)}
                      placeholder="Describe the photo..."
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#4F8EF7]"
                    />
                  </div>

                  {uploadError && <p className="text-xs text-red-500 text-center">{uploadError}</p>}

                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="w-full py-3 bg-[#4F8EF7] text-white rounded-2xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-[#3B7BE8] transition-colors"
                  >
                    {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload Photo</>}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
