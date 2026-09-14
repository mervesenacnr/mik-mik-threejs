# Yerel doğrulama — 14 Eylül 2026

- Node.js 26.5.0, Three.js 0.186.0, Vite 8.3.0.
- 14 Node test senaryosu geçti (servis döngüsü, XP, evrim, yuva, insan vuruşları, navigasyon, pause, dash, kayıt, açılımlar, dalga/patron ve kalabalık).
- Chrome tarayıcısında `tests/browser-check.browser.js`: 25 kontrol geçti. WASD/ok, Space, Escape, otomatik servis/ödeme/temizlik, geliştirme butonu, kaşık, para, insan modeli ve ölüm animasyonunun pause ile durması.
- Görsel inceleme: 1440 × 900 ekran görüntüleri; menü/karakter, tabaklar, müşteri göstergeleri, farklı düşmanlar ve geliştirme ekranı.
- 96 düşman + 10 müşteri ile 6 saniyelik yerel stres denemesi: son 300 karede p50 16,70 ms; p95 16,80 ms; yaklaşık 60 FPS. Örnek sonunda 1.104 çizim çağrısı ve 3,14 milyon üçgen (gölge geçişleri dahil). Bu kısa ölçüm cihaz/tarayıcıya özgüdür, motorlar arası performans karşılaştırması değildir.
- Üretim derlemesi yerel önizlemede açıldı; `?test=1` olsa bile test API'si bulunmadığı doğrulandı. Son tarayıcı konsolunda hata veya uyarı yok.
- Test profili bellek içindedir; oyuncunun tarayıcı kaydı değiştirilmedi.
- Orijinal Godot çalışma ağacı aynı branch/commit ile temiz kaldı: `codex/service-and-combat-animations`, `f0c15ab2368de4a011cfcf45168914f70e7d18e3`.

Uzun süreli oyuncu dengelemesi, farklı GPU'lar ve mobil cihazlar bu ilk aktarımın doğrulama kapsamına dahil değildir. Mobil dokunmatik kontrol eklenmemiştir; oyun klavye gerektirir.
