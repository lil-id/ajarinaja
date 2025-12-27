import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Award, ArrowRight, GraduationCap, BarChart3, CheckCircle, Play } from 'lucide-react';
import heroClassroom from '@/assets/hero-classroom.jpg';
import teacherTeaching from '@/assets/teacher-teaching.jpg';
import studentsStudying from '@/assets/students-studying.jpg';
import studentExam from '@/assets/student-exam.jpg';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-secondary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-secondary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">EduExam</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Fitur</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">Tentang</a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimoni</a>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Masuk
            </Button>
            <Button variant="hero" onClick={() => navigate('/login')}>
              Mulai Sekarang
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="container mx-auto max-w-7xl relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full text-secondary text-sm font-medium mb-6">
                <Award className="w-4 h-4" />
                Dipercaya 500+ Institusi Pendidikan
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight">
                Transformasi
                <span className="text-gradient block">Pengalaman Belajar</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Buat, kelola, dan selenggarakan ujian dengan mudah. Berdayakan guru dengan alat canggih 
                dan berikan siswa pengalaman belajar yang intuitif.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button variant="hero" size="xl" onClick={() => navigate('/login')}>
                  Mulai Mengajar
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="xl" onClick={() => navigate('/login')}>
                  <Play className="w-4 h-4" />
                  Lihat Demo
                </Button>
              </div>
              <div className="flex items-center gap-6 mt-8 pt-8 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">10K+</div>
                  <div className="text-sm text-muted-foreground">Siswa Aktif</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">500+</div>
                  <div className="text-sm text-muted-foreground">Sekolah</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">50K+</div>
                  <div className="text-sm text-muted-foreground">Ujian Dibuat</div>
                </div>
              </div>
            </div>
            <div className="relative animate-slide-up">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src={heroClassroom} 
                  alt="Kelas modern dengan guru dan siswa" 
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl shadow-card animate-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Ujian Selesai</div>
                    <div className="text-sm text-muted-foreground">1,234 hari ini</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 grid grid-cols-2 gap-4">
              <img 
                src={teacherTeaching} 
                alt="Guru mengajar di kelas" 
                className="rounded-2xl shadow-lg w-full h-48 object-cover animate-slide-up"
                style={{ animationDelay: '100ms' }}
              />
              <img 
                src={studentsStudying} 
                alt="Siswa belajar bersama" 
                className="rounded-2xl shadow-lg w-full h-48 object-cover mt-8 animate-slide-up"
                style={{ animationDelay: '200ms' }}
              />
              <img 
                src={studentExam} 
                alt="Siswa mengerjakan ujian online" 
                className="rounded-2xl shadow-lg w-full h-48 object-cover animate-slide-up"
                style={{ animationDelay: '300ms' }}
              />
              <div className="bg-gradient-hero rounded-2xl p-6 flex flex-col justify-center items-center text-center mt-8 animate-slide-up" style={{ animationDelay: '400ms' }}>
                <div className="text-4xl font-bold text-primary-foreground">98%</div>
                <div className="text-sm text-primary-foreground/80">Tingkat Kepuasan</div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Platform Pendidikan Modern untuk Era Digital
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                EduExam dirancang untuk memudahkan guru dalam membuat dan mengelola ujian, 
                serta memberikan pengalaman belajar yang menyenangkan bagi siswa. Dengan teknologi 
                terdepan, kami membantu institusi pendidikan bertransformasi ke era digital.
              </p>
              <ul className="space-y-4">
                {[
                  'Antarmuka yang mudah digunakan untuk guru dan siswa',
                  'Analitik mendalam untuk memantau kemajuan belajar',
                  'Keamanan data tingkat enterprise',
                  'Dukungan teknis 24/7'
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-secondary" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Fitur Lengkap untuk Kebutuhan Anda
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Platform lengkap untuk pendidikan modern
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BookOpen className="w-8 h-8" />}
              title="Manajemen Kursus"
              description="Buat dan atur kursus dengan mudah. Tambahkan konten, atur jadwal, dan pantau kemajuan dalam satu tempat."
              delay={0}
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Pendaftaran Siswa"
              description="Siswa dapat dengan mudah mendaftar ke kursus dan mengakses semua materi pembelajaran dan ujian."
              delay={100}
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8" />}
              title="Analitik Ujian"
              description="Buat ujian pilihan ganda dan esai. Dapatkan analitik detail tentang performa siswa."
              delay={200}
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Apa Kata Mereka?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Testimoni dari guru dan siswa yang telah menggunakan EduExam
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="EduExam sangat membantu saya dalam mengelola ujian untuk 200+ siswa. Prosesnya jadi jauh lebih efisien!"
              name="Budi Santoso"
              role="Guru Matematika, SMA Negeri 1"
              delay={0}
            />
            <TestimonialCard
              quote="Platform yang sangat user-friendly. Siswa-siswa saya jadi lebih semangat mengerjakan ujian online."
              name="Siti Rahayu"
              role="Guru Bahasa Inggris, SMP Negeri 5"
              delay={100}
            />
            <TestimonialCard
              quote="Fitur analitiknya luar biasa! Saya bisa melihat di mana siswa kesulitan dan fokus mengajar di area tersebut."
              name="Ahmad Wijaya"
              role="Kepala Sekolah, SMK Teknologi"
              delay={200}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-hero rounded-3xl p-12 text-center shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Siap Memulai?
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Bergabunglah dengan ribuan pendidik yang telah menggunakan EduExam untuk transformasi pengajaran mereka.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="heroOutline" size="xl" onClick={() => navigate('/login')}>
                  Buat Akun Gratis
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="xl" 
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => navigate('/login')}
                >
                  Hubungi Sales
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-secondary rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-secondary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">EduExam</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Platform ujian online terdepan untuk institusi pendidikan di Indonesia.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Produk</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Fitur</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Harga</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Integrasi</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Perusahaan</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Tentang Kami</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Karir</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Dukungan</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Bantuan</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Kontak</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 EduExam. Hak cipta dilindungi.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Kebijakan Privasi</a>
              <a href="#" className="hover:text-foreground transition-colors">Syarat & Ketentuan</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

function FeatureCard({ 
  icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  delay: number;
}) {
  return (
    <div 
      className="bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 animate-slide-up border border-border/50"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function TestimonialCard({
  quote,
  name,
  role,
  delay
}: {
  quote: string;
  name: string;
  role: string;
  delay: number;
}) {
  return (
    <div 
      className="bg-card rounded-2xl p-8 shadow-card animate-slide-up border border-border/50"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
      </div>
      <p className="text-foreground mb-6 leading-relaxed">"{quote}"</p>
      <div>
        <div className="font-semibold text-foreground">{name}</div>
        <div className="text-sm text-muted-foreground">{role}</div>
      </div>
    </div>
  );
}

export default Index;
