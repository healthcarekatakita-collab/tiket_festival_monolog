import React, { useState } from 'react';
import { Sparkles, User, School, Search, Ticket, Flame, Trophy, CheckCircle2, ChevronRight, Star, CheckSquare } from 'lucide-react';
import { renderColorfulTitle } from './EventLanding';

export interface PerformerShow {
  id: number;
  showNumber: string;
  actorName: string;
  schoolName: string;
  genreTag: string;
  badgeColor: string;
}

export const FESTIVAL_PERFORMERS: PerformerShow[] = [
  {
    id: 1,
    showNumber: 'Show 01',
    actorName: 'Gerrald Pratama',
    schoolName: 'SMKN 5 BANDAR LAMPUNG',
    genreTag: 'Monolog Kemanusiaan',
    badgeColor: 'bg-red-100 text-red-800 border-red-300'
  },
  {
    id: 2,
    showNumber: 'Show 02',
    actorName: 'Nayla Zahra Thahira',
    schoolName: 'SMKN 4 BANDAR LAMPUNG',
    genreTag: 'Monolog Drama Psikologis',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  {
    id: 3,
    showNumber: 'Show 03',
    actorName: 'Farraas Nayyara',
    schoolName: 'SMAN 2 BANDAR LAMPUNG',
    genreTag: 'Monolog Satir Sosial',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  },
  {
    id: 4,
    showNumber: 'Show 04',
    actorName: 'Della Oktavia',
    schoolName: 'SMKN 1 NEGERI AGUNG',
    genreTag: 'Monolog Perjuangan Remaja',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    id: 5,
    showNumber: 'Show 05',
    actorName: 'Rasyanti Ismawarni',
    schoolName: 'SMAN 1 SUKADANA',
    genreTag: 'Monolog Budaya & Tradisi',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300'
  },
  {
    id: 6,
    showNumber: 'Show 06',
    actorName: 'Fawzyyah Firdausi Ahla',
    schoolName: 'SMAN 5 BANDAR LAMPUNG',
    genreTag: 'Monolog Eksistensialisme',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  {
    id: 7,
    showNumber: 'Show 07',
    actorName: 'Wayan Exsel William Pratama',
    schoolName: 'SMKN 1 NEGERI AGUNG',
    genreTag: 'Monolog Tragedi Klasik',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    id: 8,
    showNumber: 'Show 08',
    actorName: 'Desya Pratiwi',
    schoolName: 'SMAN 1 SUKADANA',
    genreTag: 'Monolog Konflik Batin',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  {
    id: 9,
    showNumber: 'Show 09',
    actorName: 'Lukman Firmansyah',
    schoolName: 'SMAN 1 PUNGGUR',
    genreTag: 'Monolog Komedi Realitas',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300'
  },
  {
    id: 10,
    showNumber: 'Show 10',
    actorName: 'Frizcha Andita Sheraldy',
    schoolName: 'SMAN 1 SUKADANA',
    genreTag: 'Monolog Puncak Mahakarya',
    badgeColor: 'bg-red-100 text-red-800 border-red-300'
  }
];

interface LineupSectionProps {
  onSelectPerformerBooking?: (performers: PerformerShow[]) => void;
}

export default function LineupSection({ onSelectPerformerBooking }: LineupSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const filteredPerformers = FESTIVAL_PERFORMERS.filter(p => 
    p.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.showNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectPerformer = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedPerformers = FESTIVAL_PERFORMERS.filter(p => selectedIds.includes(p.id));

  const handleCheckoutSelectedShows = () => {
    if (selectedPerformers.length > 0 && onSelectPerformerBooking) {
      onSelectPerformerBooking(selectedPerformers);
    }
  };

  const handleSingleCardCheckout = (p: PerformerShow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectPerformerBooking) {
      onSelectPerformerBooking([p]);
    }
  };

  // Pricing calculation recommendation
  const getPackageRecommendation = (count: number) => {
    if (count === 1) {
      return {
        name: 'Single Show Pass',
        price: 'Rp 20.000',
        badge: 'Satuan',
        badgeColor: 'bg-slate-100 text-slate-800'
      };
    } else if (count === 2) {
      return {
        name: 'Double Show Pass',
        price: 'Rp 30.000',
        badge: 'Hemat Rp 10.000!',
        badgeColor: 'bg-red-100 text-red-700 font-extrabold'
      };
    } else {
      return {
        name: 'Maraton Day Pass (5 Show)',
        price: 'Rp 35.000',
        badge: 'SUPER HEMAT 65%!',
        badgeColor: 'bg-amber-400 text-slate-950 font-black'
      };
    }
  };

  const reco = getPackageRecommendation(selectedIds.length);

  return (
    <section className="space-y-6 scroll-mt-24" id="lineup-performers">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-red-800/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full backdrop-blur-md">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
            <span>10 Pementasan Utama Festival</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight uppercase font-sans">
            10 Aktor Muda Berbakat & Pertunjukan Pilihan
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
            Pilihlah pertunjukan favorit Anda dengan memberi <strong className="text-amber-300 font-extrabold">tanda centang (✓)</strong> pada kartu penampil di bawah ini, lalu klik tombol <strong className="text-amber-300 font-extrabold">"Beli Tiket Show Ini"</strong> untuk langsung melakukan pemesanan!
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg border border-white/10">
              <Trophy className="w-4 h-4 text-amber-400" />
              10 Pertunjukan Eksklusif
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg border border-white/10">
              <School className="w-4 h-4 text-blue-400" />
              SMA & SMK Se-Provinsi Lampung
            </span>
          </div>
        </div>
      </div>

      {/* Floating / Sticky Bar when shows are selected */}
      {selectedIds.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-red-950 to-indigo-950 p-4 rounded-2xl border-2 border-amber-400 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in sticky top-20 z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-md shrink-0">
              {selectedIds.length}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs sm:text-sm text-white">
                  {selectedIds.length} Pertunjukan Dipilih:
                </span>
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${reco.badgeColor}`}>
                  {reco.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-semibold mt-0.5">
                Rekomendasi Paket: <strong className="text-amber-300 font-black">{reco.name} ({reco.price})</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-extrabold rounded-xl transition cursor-pointer"
            >
              Riset Pilihan
            </button>

            <button
              onClick={handleCheckoutSelectedShows}
              className="flex-1 md:flex-initial px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Ticket className="w-4 h-4 fill-slate-950" />
              <span>Beli Tiket ({selectedIds.length} Show Dipilih)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search Filter Bar & Guidance Callout */}
      <div className="space-y-3">
        <div className="bg-gradient-to-r from-amber-500/15 via-red-500/10 to-amber-500/15 border-2 border-amber-400 p-4 rounded-2xl flex items-start sm:items-center gap-3 shadow-md">
          <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-black shrink-0 shadow-sm">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 text-slate-800 text-xs">
            <p className="font-extrabold text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>💡 Petunjuk Pemilihan Pertunjukan (Show)</span>
            </p>
            <p className="font-medium text-slate-700 leading-relaxed">
              Klik/Centang tombol <strong className="text-red-700 bg-amber-200/90 px-1.5 py-0.5 rounded font-extrabold">"+ Pilih Show"</strong> di sudut kanan atas kartu aktor untuk memilih pertunjukan. Pilihan 2 Show atau 5 Show akan langsung mendapatkan diskon Paket Hemat!
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Nama Aktor atau Nama Sekolah..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-red-500 focus:bg-white transition-all"
            />
          </div>

          <div className="text-xs text-slate-500 font-bold self-end sm:self-center">
            Menampilkan <span className="text-red-700 font-black">{filteredPerformers.length}</span> dari <span className="text-slate-900 font-black">10 Pertunjukan</span>
          </div>
        </div>
      </div>

      {/* Grid of 10 Performers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPerformers.map((p) => {
          const isChecked = selectedIds.includes(p.id);

          return (
            <div
              key={p.id}
              onClick={() => toggleSelectPerformer(p.id)}
              className={`rounded-2xl border-2 p-5 space-y-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden cursor-pointer ${
                isChecked
                  ? 'bg-amber-50/90 border-amber-500 shadow-amber-500/10 ring-2 ring-amber-400/50'
                  : 'bg-white border-slate-200/90 hover:border-amber-400'
              }`}
            >
              {/* Top Header Row with Show Number & Prominent Checkbox Selector */}
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-xs px-3 py-1 rounded-xl bg-slate-900 text-amber-400 uppercase tracking-wider shadow-xs">
                  {p.showNumber}
                </span>

                {/* Prominent Checkbox Selector Button */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelectPerformer(p.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 transition-all font-black text-xs cursor-pointer ${
                    isChecked 
                      ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300' 
                      : 'bg-white border-red-500/40 text-red-700 hover:bg-red-50 shadow-xs'
                  }`}
                  title="Klik untuk memilih/membatalkan show ini"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelectPerformer(p.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer accent-red-600"
                  />
                  <span>{isChecked ? '✓ Terpilih' : '+ Pilih Show'}</span>
                </div>
              </div>

              {/* Actor Details */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-sm shrink-0 group-hover:scale-110 transition-transform ${
                    isChecked ? 'bg-amber-500 text-slate-950' : 'bg-gradient-to-br from-red-600 to-amber-500'
                  }`}>
                    {isChecked ? <CheckCircle2 className="w-5 h-5 text-slate-950" /> : <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug group-hover:text-red-700 transition-colors">
                      {p.actorName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold mt-0.5">
                      <School className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{p.schoolName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Booking Action Button */}
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[10px] font-mono font-extrabold text-slate-500 flex items-center gap-1">
                  {isChecked ? (
                    <span className="text-amber-800 font-black flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Show Terpilih
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Penampil Pilihan
                    </span>
                  )}
                </span>

                <button
                  onClick={(e) => handleSingleCardCheckout(p, e)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Beli Tiket Show Ini</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
