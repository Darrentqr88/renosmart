'use client';

import { useState, useEffect } from 'react';
import { Camera, CheckCircle2, Clock, Loader2, ChevronLeft, FolderOpen, Image } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ProjectSummary } from './WorkerProjectCard';
import { useI18n } from '@/lib/i18n/context';

interface SitePhoto {
  id: string;
  url: string;
  caption?: string;
  trade?: string;
  approved: boolean;
  created_at: string;
  project_id?: string;
}

interface WorkerPhotosTabProps {
  sessionUserId: string;
  projects: ProjectSummary[];
}

export default function WorkerPhotosTab({ sessionUserId, projects }: WorkerPhotosTabProps) {
  const supabase = createClient();
  const { lang } = useI18n();

  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<SitePhoto | null>(null);

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
      .limit(200);
    setPhotos(data || []);
    setLoadingPhotos(false);
  };

  // Group photos by project
  const photosByProject = (() => {
    const map = new Map<string, SitePhoto[]>();
    for (const p of photos) {
      const pid = p.project_id || '__unlinked__';
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(p);
    }
    return map;
  })();

  const getProjectName = (pid: string) => {
    if (pid === '__unlinked__') return lang === 'ZH' ? '未分类' : lang === 'BM' ? 'Tidak dikategori' : 'Uncategorized';
    return projects.find(p => p.id === pid)?.name || (lang === 'ZH' ? '工程' : 'Project');
  };

  // Projects that have photos (ordered by most recent photo)
  const projectIds = Array.from(photosByProject.keys());

  const selectedProjectPhotos = selectedProjectId ? (photosByProject.get(selectedProjectId) || []) : [];

  const labels = {
    title: lang === 'ZH' ? '照片相册' : lang === 'BM' ? 'Album Foto' : 'Photo Album',
    projects: lang === 'ZH' ? '个工程' : lang === 'BM' ? ' projek' : ' projects',
    photos: lang === 'ZH' ? '张照片' : lang === 'BM' ? ' foto' : ' photos',
    noPhotos: lang === 'ZH' ? '还没有照片' : lang === 'BM' ? 'Tiada foto lagi' : 'No photos yet',
    noPhotosHint: lang === 'ZH' ? '从任务卡片上传工地照片' : lang === 'BM' ? 'Muat naik foto dari kad tugas' : 'Upload photos from task cards',
    back: lang === 'ZH' ? '返回' : lang === 'BM' ? 'Kembali' : 'Back',
    approved: lang === 'ZH' ? '已批准' : lang === 'BM' ? 'Diluluskan' : 'Approved',
    pending: lang === 'ZH' ? '待审核' : lang === 'BM' ? 'Menunggu' : 'Pending',
  };

  // ── Lightbox view ──
  if (selectedPhoto) {
    return (
      <div className="flex flex-col h-full bg-black">
        <div className="flex items-center gap-3 px-4 py-3 bg-black/80">
          <button onClick={() => setSelectedPhoto(null)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            {selectedPhoto.caption && (
              <p className="text-white text-xs truncate">{selectedPhoto.caption}</p>
            )}
            {selectedPhoto.trade && (
              <p className="text-white/50 text-[10px]">{selectedPhoto.trade}</p>
            )}
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            selectedPhoto.approved ? 'bg-green-500/90 text-white' : 'bg-amber-500/90 text-white'
          }`}>
            {selectedPhoto.approved ? labels.approved : labels.pending}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.caption || 'Site photo'}
            className="max-w-full max-h-full object-contain rounded-lg"
            onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23222"/><text x="100" y="105" text-anchor="middle" fill="%23666" font-size="14">Photo</text></svg>'; }}
          />
        </div>
      </div>
    );
  }

  // ── Project folder gallery view ──
  if (selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        {/* Folder header */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-2">
          <button onClick={() => setSelectedProjectId(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm truncate">{getProjectName(selectedProjectId)}</h3>
            <p className="text-[10px] text-gray-400">{selectedProjectPhotos.length}{labels.photos}</p>
          </div>
        </div>

        {/* Photo grid */}
        <div className="flex-1 overflow-y-auto bg-rs-bg p-3 overscroll-contain">
          {selectedProjectPhotos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Image className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium text-sm">{labels.noPhotos}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {selectedProjectPhotos.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="relative rounded-xl overflow-hidden bg-gray-100 aspect-square group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Site photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="55" text-anchor="middle" fill="%239ca3af" font-size="12">Photo</text></svg>'; }}
                  />
                  {/* Status dot */}
                  <div className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border border-white/80 ${
                    photo.approved ? 'bg-green-500' : 'bg-amber-400'
                  }`} />
                  {/* Trade badge */}
                  {photo.trade && (
                    <div className="absolute bottom-1.5 left-1.5 bg-black/50 backdrop-blur-sm text-white text-[8px] px-1.5 py-0.5 rounded-md font-medium">
                      {photo.trade}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Folder list (main view) ──
  return (
    <div className="flex flex-col h-full">
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
            <p className="text-gray-500 font-medium text-sm">{labels.noPhotos}</p>
            <p className="text-gray-400 text-xs mt-1">{labels.noPhotosHint}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projectIds.map(pid => {
              const projectPhotos = photosByProject.get(pid) || [];
              const approvedCount = projectPhotos.filter(p => p.approved).length;
              // Use up to 4 thumbnails for folder cover
              const coverPhotos = projectPhotos.slice(0, 4);

              return (
                <button
                  key={pid}
                  onClick={() => setSelectedProjectId(pid)}
                  className="w-full bg-white rounded-2xl p-3 shadow-sm hover:shadow-md transition-all text-left"
                >
                  <div className="flex gap-3">
                    {/* Folder cover — 2x2 grid thumbnail */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 grid grid-cols-2 grid-rows-2 gap-px">
                      {coverPhotos.map((photo, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={photo.id}
                          src={photo.url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="%23f3f4f6"/></svg>'; }}
                        />
                      ))}
                      {/* Fill empty slots */}
                      {Array.from({ length: Math.max(0, 4 - coverPhotos.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-gray-50" />
                      ))}
                    </div>

                    {/* Folder info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FolderOpen className="w-3.5 h-3.5 text-[#4F8EF7]" />
                        <h3 className="font-semibold text-gray-900 text-[13px] truncate">
                          {getProjectName(pid)}
                        </h3>
                      </div>
                      <p className="text-[11px] text-gray-400 mb-2">
                        {projectPhotos.length}{labels.photos}
                      </p>
                      {/* Status summary */}
                      <div className="flex items-center gap-3">
                        {approvedCount > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            {approvedCount}
                          </span>
                        )}
                        {projectPhotos.length - approvedCount > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-500">
                            <Clock className="w-3 h-3" />
                            {projectPhotos.length - approvedCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
