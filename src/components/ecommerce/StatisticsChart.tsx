import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { ContractsAPI } from "../../api/endpoints/contracts";

export default function StatisticsChart() {
  const [cautionsData, setCautionsData] = useState<number[]>(Array(12).fill(0));
  const [totalsData, setTotalsData] = useState<number[]>(Array(12).fill(0));
  const [isLoading, setIsLoading] = useState(true);
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Récupération de tous les contrats
        const contracts = await ContractsAPI.listAll();

        // Initialiser les tableaux pour les 12 mois
        const monthlyCautions = Array(12).fill(0);
        const monthlyTotals = Array(12).fill(0);

        // Calculer les sommes par mois
        contracts.forEach((contract) => {
          const contractDate = new Date(contract.start_datetime);
          const contractYear = contractDate.getFullYear();
          const contractMonth = contractDate.getMonth(); // 0-11

          // On ne compte que les contrats de l'année en cours
          if (contractYear === currentYear) {
            // Convertir les cautions TTC en nombre
            const cautionTTC = typeof contract.caution_ttc === 'string'
              ? parseFloat(contract.caution_ttc)
              : Number(contract.caution_ttc || 0);

            // Convertir les prix totaux TTC en nombre
            const totalTTC = typeof contract.total_price_ttc === 'string'
              ? parseFloat(contract.total_price_ttc)
              : Number(contract.total_price_ttc || 0);

            monthlyCautions[contractMonth] += cautionTTC;
            monthlyTotals[contractMonth] += totalTTC;
          }
        });

        setCautionsData(monthlyCautions);
        setTotalsData(monthlyTotals);
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentYear]);

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
      labels: {
        colors: ["#6B7280"],
      },
    },
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "smooth",
      width: [3, 3],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      x: {
        show: true,
      },
      y: {
        formatter: (val: number) => `${val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
      },
    },
    xaxis: {
      type: "category",
      categories: [
        "Jan",
        "Fév",
        "Mar",
        "Avr",
        "Mai",
        "Juin",
        "Juil",
        "Août",
        "Sep",
        "Oct",
        "Nov",
        "Déc",
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
        formatter: (val: number) => `${Math.round(val)}€`,
      },
      title: {
        text: "",
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  const series = [
    {
      name: "Prix Totaux TTC",
      data: totalsData,
    },
    {
      name: "Cautions TTC",
      data: cautionsData,
    },
  ];
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Statistiques {currentYear}
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Comparaison des prix totaux et des cautions par mois
          </p>
        </div>
        <div className="flex items-start w-full gap-3 sm:justify-end">
          {isLoading && (
            <span className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
              Chargement...
            </span>
          )}
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-[310px]">
              <span className="text-gray-500 animate-pulse">Chargement des données...</span>
            </div>
          ) : (
            <Chart options={options} series={series} type="area" height={310} />
          )}
        </div>
      </div>
    </div>
  );
}
