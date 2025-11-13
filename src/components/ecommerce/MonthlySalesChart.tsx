import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { ContractsAPI } from "../../api/endpoints/contracts";

export default function MonthlySalesChart() {
  const [monthlyData, setMonthlyData] = useState<number[]>(Array(12).fill(0));
  const [isLoading, setIsLoading] = useState(true);
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchContractsData = async () => {
      try {
        setIsLoading(true);

        // Récupération de tous les contrats
        const contracts = await ContractsAPI.listAll();

        // Initialiser un tableau pour les 12 mois
        const monthlySales = Array(12).fill(0);

        // Calculer les sommes par mois
        contracts.forEach((contract) => {
          // On utilise la date de début du contrat pour déterminer le mois
          const contractDate = new Date(contract.start_datetime);
          const contractYear = contractDate.getFullYear();
          const contractMonth = contractDate.getMonth(); // 0-11

          // On ne compte que les contrats de l'année en cours
          if (contractYear === currentYear) {
            // Convertir le prix TTC en nombre
            const priceTTC = typeof contract.total_price_ttc === 'string'
              ? parseFloat(contract.total_price_ttc)
              : Number(contract.total_price_ttc || 0);

            monthlySales[contractMonth] += priceTTC;
          }
        });

        setMonthlyData(monthlySales);
      } catch (error) {
        console.error("Erreur lors de la récupération des données de contrats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContractsData();
  }, [currentYear]);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
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
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
      },
      labels: {
        formatter: (val: number) => `${Math.round(val)}€`,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      x: {
        show: true,
      },
      y: {
        formatter: (val: number) => `${val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
        title: {
          formatter: () => "Chiffre d'affaires TTC:",
        },
      },
    },
  };

  const series = [
    {
      name: "CA TTC",
      data: monthlyData,
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Chiffre d'affaires mensuels {currentYear}
        </h3>
        {isLoading && (
          <span className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
            Chargement...
          </span>
        )}
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <Chart options={options} series={series} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
}
