'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/layouts/AppShell';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import Dialog from '@/components/ui/Dialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import FormField from '@/components/ui/FormField';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import {
  AlertCircle,
  CalendarDays,
  Clock,
  Link2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  School,
  Trash2,
  UserRound,
} from 'lucide-react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

interface ClassItem {
  id: number;
  name: string;
  guru_id?: number | null;
  guru_name?: string | null;
}

interface GuruItem {
  id: number;
  name: string;
}

interface ScheduleItem {
  id: number;
  class_id: number | null;
  class_name?: string | null;
  guru_id: number | null;
  guru_name?: string | null;
  day: string;
  time_start: string;
  time_end?: string | null;
  activity_name: string;
  location?: string | null;
  description?: string | null;
}

interface ScheduleForm {
  class_id: string;
  guru_id: string;
  day: string;
  time_start: string;
  time_end: string;
  activity_name: string;
  location: string;
  description: string;
}

const emptyForm: ScheduleForm = {
  class_id: '',
  guru_id: '',
  day: 'Senin',
  time_start: '07:00',
  time_end: '08:00',
  activity_name: '',
  location: 'Masjid Utama',
  description: '',
};

export default function JadwalPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const isGuru = user?.role === 'guru';

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [gurus, setGurus] = useState<GuruItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [error, setError] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [form, setForm] = useState<ScheduleForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        setLoadingMeta(true);
        const classRes = await api.get('/classes');
        const allClasses: ClassItem[] = classRes.data?.data || [];
        setClasses(
          isGuru
            ? allClasses.filter((item) => Number(item.guru_id) === Number(user?.id))
            : allClasses
        );

        if (!isGuru) {
          const guruRes = await api.get('/users?role=guru&limit=100');
          setGurus(guruRes.data?.data || []);
        }
      } catch (err) {
        console.error('Failed to load schedule metadata:', err);
        setError('Gagal memuat data kelas dan guru. Periksa koneksi Anda lalu coba lagi.');
      } finally {
        setLoadingMeta(false);
      }
    };

    if (user) loadMeta();
  }, [isGuru, user]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError('');
      const params: Record<string, string> = {};
      if (classFilter) params.class_id = classFilter;
      if (dayFilter) params.day = dayFilter;
      const res = await api.get('/schedules', { params });
      setSchedules(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load schedules:', err);
      setError('Gagal memuat jadwal halaqah. Periksa koneksi Anda lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingMeta) loadSchedules();
  }, [classFilter, dayFilter, loadingMeta]);

  const reload = async () => {
    await loadSchedules();
  };

  const openCreate = () => {
    const defaultClass = classFilter && classFilter !== 'unassigned' ? classFilter : '';
    const fallbackClass =
      !defaultClass && isGuru && classes.length === 1 ? String(classes[0].id) : defaultClass;
    setEditing(null);
    setForm({
      ...emptyForm,
      class_id: fallbackClass,
      guru_id: isGuru && user ? String(user.id) : '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (schedule: ScheduleItem) => {
    setEditing(schedule);
    setForm({
      class_id: schedule.class_id ? String(schedule.class_id) : '',
      guru_id: schedule.guru_id ? String(schedule.guru_id) : '',
      day: schedule.day || 'Senin',
      time_start: schedule.time_start || '07:00',
      time_end: schedule.time_end || '',
      activity_name: schedule.activity_name || '',
      location: schedule.location || 'Masjid Utama',
      description: schedule.description || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!form.class_id) {
      setFormError('Kelas/halaqah wajib dipilih.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        class_id: Number(form.class_id),
        guru_id: form.guru_id ? Number(form.guru_id) : null,
        day: form.day,
        time_start: form.time_start,
        time_end: form.time_end || null,
        activity_name: form.activity_name,
        location: form.location,
        description: form.description || null,
      };

      if (editing) {
        await api.put(`/schedules/${editing.id}`, payload);
        showToast('Jadwal halaqah berhasil diperbarui.');
      } else {
        await api.post('/schedules', payload);
        showToast('Jadwal halaqah berhasil ditambahkan.');
      }

      setModalOpen(false);
      setEditing(null);
      await reload();
    } catch (err: any) {
      setFormError(
        err.response?.data?.message || err.message || 'Gagal menyimpan jadwal halaqah.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/schedules/${deleteTarget.id}`);
      showToast('Jadwal halaqah berhasil dihapus.');
      setDeleteTarget(null);
      await reload();
    } catch (err: any) {
      showToast(
        err.response?.data?.message || err.message || 'Gagal menghapus jadwal halaqah.',
        'error'
      );
    } finally {
      setDeleting(false);
    }
  };

  const assignedSchedules = useMemo(
    () => schedules.filter((item) => Boolean(item.class_id)),
    [schedules]
  );

  const unassignedSchedules = useMemo(
    () => schedules.filter((item) => !item.class_id),
    [schedules]
  );

  const groupedByDay = useMemo(
    () =>
      DAYS.map((day) => ({
        day,
        items: assignedSchedules.filter((item) => item.day === day),
      })).filter((group) => group.items.length > 0),
    [assignedSchedules]
  );

  const hasActiveFilter = Boolean(classFilter || dayFilter);

  const resetFilters = () => {
    setClassFilter('');
    setDayFilter('');
  };

  const renderScheduleCard = (item: ScheduleItem) => (
    <article
      key={item.id}
      className={`rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        item.class_id ? 'border-slate-200' : 'border-amber-200'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50 px-2 py-3 text-emerald-700">
            <Clock size={16} />
            <span className="mt-1 text-sm font-bold">{item.time_start}</span>
            {item.time_end && (
              <span className="text-[10px] font-medium text-emerald-600">s.d. {item.time_end}</span>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900">{item.activity_name}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {item.class_id ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  <School size={12} />
                  {item.class_name || 'Kelas'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                  <AlertCircle size={12} />
                  Belum ditautkan ke kelas
                </span>
              )}
              {item.guru_name && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  <UserRound size={12} />
                  {item.guru_name}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} />
                {item.location || 'Masjid Utama'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={13} />
                {item.day}
              </span>
            </div>
            {item.description && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                {item.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
          <button
            type="button"
            onClick={() => openEdit(item)}
            aria-label={`Edit ${item.activity_name}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <Pencil size={17} />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(item)}
            aria-label={`Hapus ${item.activity_name}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    </article>
  );

  return (
    <AppShell
      title="Jadwal Halaqah"
      subtitle={
        isGuru
          ? 'Kelola jadwal kegiatan halaqah yang Anda ampu'
          : 'Atur jadwal kegiatan tahfidz untuk setiap kelas atau halaqah'
      }
    >
      <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Jadwal per hari
            </p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">
              {isGuru ? 'Jadwal Halaqah Saya' : 'Jadwal Kegiatan Halaqah'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isGuru
                ? 'Setiap jadwal wajib terhubung ke kelas/halaqah. Anda hanya dapat mengelola jadwal halaqah sendiri.'
                : 'Jadwal lama tanpa kelas tetap ditampilkan agar bisa ditautkan.'}
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
          >
            <Plus size={18} />
            <span>Tambah Jadwal</span>
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="flex-1">
            <label htmlFor="filter-kelas" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Filter kelas / halaqah
            </label>
            <select
              id="filter-kelas"
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <option value="">Semua halaqah</option>
              {!isGuru && <option value="unassigned">Belum ditautkan</option>}
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="filter-hari" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Filter hari
            </label>
            <select
              id="filter-hari"
              value={dayFilter}
              onChange={(event) => setDayFilter(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <option value="">Semua hari</option>
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 sm:self-end"
            >
              Reset filter
            </button>
          )}
        </div>

        {error ? (
          <ErrorState
            title="Gagal memuat jadwal"
            description={error}
            onRetry={reload}
            className="rounded-2xl border border-slate-200 bg-white"
          />
        ) : loading || loadingMeta ? (
          <div className="space-y-4" aria-label="Memuat jadwal">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : schedules.length === 0 ? (
          <EmptyState
            title={hasActiveFilter ? 'Tidak ada jadwal pada filter ini' : 'Belum ada jadwal halaqah'}
            description={
              hasActiveFilter
                ? 'Coba ubah atau reset filter untuk melihat jadwal lainnya.'
                : isGuru
                ? 'Tambahkan jadwal pertama untuk halaqah yang Anda ampu.'
                : 'Tambahkan jadwal kegiatan agar wali santri dan guru dapat melihatnya di aplikasi.'
            }
            icon={<CalendarDays size={22} />}
            className="rounded-2xl border border-slate-200 bg-white"
            action={
              hasActiveFilter ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Reset filter
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  <Plus size={17} />
                  Tambah Jadwal
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-8">
            {unassignedSchedules.length > 0 && (
              <section aria-labelledby="jadwal-belum-ditautkan">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h2 id="jadwal-belum-ditautkan" className="text-base font-bold text-slate-900">
                    Belum ditautkan ke kelas
                  </h2>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                    {unassignedSchedules.length} jadwal
                  </span>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-slate-500">
                  Jadwal lama ini belum tampil di aplikasi mobile. Edit jadwal untuk memilih kelas/halaqah.
                </p>
                <div className="space-y-3">{unassignedSchedules.map(renderScheduleCard)}</div>
              </section>
            )}

            {groupedByDay.map((group) => (
              <section key={group.day} aria-labelledby={`hari-${group.day}`}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h2 id={`hari-${group.day}`} className="text-base font-bold text-slate-900">
                    {group.day}
                  </h2>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    {group.items.length} jadwal
                  </span>
                </div>
                <div className="space-y-3">{group.items.map(renderScheduleCard)}</div>
              </section>
            ))}

            {unassignedSchedules.length === 0 && groupedByDay.length === 0 && (
              <EmptyState
                title="Tidak ada jadwal"
                description="Belum ada jadwal yang sesuai dengan filter saat ini."
                icon={<CalendarDays size={22} />}
                className="rounded-2xl border border-slate-200 bg-white"
              />
            )}
          </div>
        )}
      </main>

      <Dialog
        open={modalOpen}
        onClose={() => {
          if (!submitting) setModalOpen(false);
        }}
        title={editing ? 'Edit Jadwal Halaqah' : 'Tambah Jadwal Halaqah'}
        description={
          editing?.class_id
            ? 'Perbarui waktu dan detail kegiatan halaqah.'
            : 'Lengkapi detail jadwal. Kelas/halaqah wajib dipilih agar jadwal tampil di aplikasi.'
        }
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
              className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              form="schedule-form"
              disabled={submitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />}
              {submitting ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Simpan Jadwal'}
            </button>
          </div>
        }
      >
        <form id="schedule-form" onSubmit={handleSubmit} className="space-y-4">
          {editing && !editing.class_id && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
              <Link2 size={16} className="mt-0.5 shrink-0" />
              <p>
                Jadwal ini berasal dari data lama dan belum memiliki kelas. Pilih kelas/halaqah agar
                dapat tampil di aplikasi mobile.
              </p>
            </div>
          )}

          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <FormField id="schedule-class" label="Kelas / Halaqah" required>
            <select
              value={form.class_id}
              onChange={(event) => {
                const classId = event.target.value;
                const selectedClass = classes.find((item) => String(item.id) === classId);
                setForm((current) => ({
                  ...current,
                  class_id: classId,
                  guru_id:
                    current.guru_id || (selectedClass?.guru_id ? String(selectedClass.guru_id) : ''),
                }));
              }}
              required
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <option value="">Pilih kelas / halaqah</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.guru_name ? ` - ${item.guru_name}` : ''}
                </option>
              ))}
            </select>
          </FormField>

          {!isGuru && (
            <FormField
              id="schedule-guru"
              label="Guru Pembimbing"
              hint="Kosongkan untuk mengikuti guru yang ditetapkan pada kelas."
            >
              <select
                value={form.guru_id}
                onChange={(event) =>
                  setForm((current) => ({ ...current, guru_id: event.target.value }))
                }
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                <option value="">Ikuti guru kelas</option>
                {gurus.map((guru) => (
                  <option key={guru.id} value={guru.id}>
                    {guru.name}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="schedule-day" label="Hari" required>
              <select
                value={form.day}
                onChange={(event) =>
                  setForm((current) => ({ ...current, day: event.target.value }))
                }
                required
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField id="schedule-activity" label="Nama Kegiatan" required>
              <input
                type="text"
                value={form.activity_name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, activity_name: event.target.value }))
                }
                required
                placeholder="Setoran ziyadah hafalan"
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="schedule-start" label="Jam Mulai" required>
              <input
                type="time"
                value={form.time_start}
                onChange={(event) =>
                  setForm((current) => ({ ...current, time_start: event.target.value }))
                }
                required
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              />
            </FormField>

            <FormField id="schedule-end" label="Jam Selesai">
              <input
                type="time"
                value={form.time_end}
                onChange={(event) =>
                  setForm((current) => ({ ...current, time_end: event.target.value }))
                }
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              />
            </FormField>
          </div>

          <FormField id="schedule-location" label="Lokasi">
            <input
              type="text"
              value={form.location}
              onChange={(event) =>
                setForm((current) => ({ ...current, location: event.target.value }))
              }
              placeholder="Masjid Utama"
              className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            />
          </FormField>

          <FormField id="schedule-description" label="Catatan Kegiatan">
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              rows={3}
              placeholder="Keterangan singkat kegiatan halaqah"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            />
          </FormField>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus jadwal halaqah?"
        description={
          deleteTarget
            ? `Jadwal "${deleteTarget.activity_name}" pada hari ${deleteTarget.day} akan dihapus permanen.`
            : ''
        }
        confirmLabel="Hapus Jadwal"
        loading={deleting}
      />
    </AppShell>
  );
}
