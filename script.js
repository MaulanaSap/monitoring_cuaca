// 1. URL API dan lokasi contoh
const urlAPI =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=-6.9222" +
  "&longitude=107.6069" +
  "&hourly=temperature_2m,precipitation_probability,precipitation" +
  "&timezone=Asia%2FJakarta" +
  "&forecast_days=2";

// Ambang peluang hujan untuk status monitoring.
const ambangHujan = 50;

// 2. Fungsi mengambil data dari API
async function ambilDataCuaca() {
  const status = document.getElementById("statusCuaca");
  const detail = document.getElementById("detailCuaca");
  const tabel = document.getElementById("daftarCuaca");

  status.textContent = "Memuat data...";
  detail.textContent = "";
  tabel.innerHTML = "";

  try {
    const response = await fetch(urlAPI);

    if (!response.ok) {
      throw new Error("Gagal mengambil data API");
    }

    const data = await response.json(); //Ubah menjadi json

    // 3. Ambil data prakiraan per jam
    const waktu = data.hourly.time;
    const suhu = data.hourly.temperature_2m;
    const peluang = data.hourly.precipitation_probability;
    const presipitasi = data.hourly.precipitation;

    // Cari jam saat ini berdasarkan waktu lokal API.
    const sekarang = new Date();

    const waktuLokal =
      sekarang.getFullYear() +
      "-" +
      String(sekarang.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(sekarang.getDate()).padStart(2, "0") +
      "T" +
      String(sekarang.getHours()).padStart(2, "0") +
      ":00";

    let waktuAwal = waktu.findIndex((jam) => jam >= waktuLokal);

    if (waktuAwal === -1) {
      throw new Error("Data waktu prakiraan tidak tersedia");
    }

    // 4. Periksa prediksi untuk jam terdekat.
    const nilaiPeluang = peluang[waktuAwal];

    if (nilaiPeluang === null || nilaiPeluang === undefined) {
      status.textContent = "Data tidak tersedia";
      detail.textContent = "Peluang hujan belum tersedia untuk jam ini.";
    } else if (nilaiPeluang >= ambangHujan) {
      status.textContent = "Berpotensi Hujan";
      detail.textContent = "Peluang hujan: " + nilaiPeluang + "%";

      document.getElementById("kotakStatus").className = "status hujan";
    } else {
      status.textContent = "Tidak Berpotensi Hujan";
      detail.textContent = "Peluang hujan: " + nilaiPeluang + "%";

      document.getElementById("kotakStatus").className = "status cerah";
    }

    // 5. Tampilkan prakiraan dengan interval 2 jam.
    // Data API tetap per jam; kita memilih setiap 2 jam.
    for (let i = waktuAwal; i < waktu.length && i < waktuAwal + 12; i += 2) {
      const baris = document.createElement("tr");

      const jam = waktu[i].replace("T", " ");
      const nilaiSuhu = suhu[i];
      const nilaiHujan = peluang[i];

      baris.innerHTML = `
                        <td>${jam}</td>
                        <td>${nilaiSuhu ?? "N/A"} °C</td>
                        <td>${nilaiHujan ?? "N/A"}%</td>
                    `;

      tabel.appendChild(baris);
    }

    // 6. Catat waktu pembaruan pada browser.
    document.getElementById("waktuUpdate").textContent =
      "Terakhir diperbarui: " + new Date().toLocaleString("id-ID");
  } catch (error) {
    status.textContent = "Gagal mengambil data";
    detail.textContent = "Periksa koneksi internet lalu coba lagi.";

    tabel.innerHTML = `
                    <tr>
                        <td colspan="3">Data tidak dapat dimuat.</td>
                    </tr>
                `;

    console.error(error);
  }
}

// 7. Ambil data saat halaman dibuka.
ambilDataCuaca();

// 8. Tombol pembaruan manual.
document
  .getElementById("tombolRefresh")
  .addEventListener("click", ambilDataCuaca);

// 9. Perbarui data otomatis setiap 2 jam.
setInterval(ambilDataCuaca, 2 * 60 * 60 * 1000);
