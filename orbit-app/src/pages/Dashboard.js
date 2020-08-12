import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import {
  faChartArea,
  faDollarSign,
  faUserPlus
} from '@fortawesome/free-solid-svg-icons';
import Card from '../components/common/Card';
import PageTitle from '../components/common/PageTitle';
import DashboardChart from './../components/DashboardChart';
import DashboardMetric from './../components/DashboardMetric';
import { formatCurrency } from './../util';

const DASHBOARD_DATA = gql`
  {
    dashboardData {
      salesVolume
      newCustomers
      refunds
      graphData {
        date
        amount
      }
    }
  }
`;

const Dashboard = () => {
  const { data } = useQuery(DASHBOARD_DATA);
  return (
    <>
      <PageTitle title="Dashboard" />
      {data ? (
        <>
          <div className="mb-4 flex flex-col sm:flex-row">
            <div className="w-full sm:w-1/3 sm:mr-2 mb-4 sm:mb-0">
              <DashboardMetric
                title="Sales Volume"
                value={formatCurrency(
                  data.dashboardData.salesVolume
                )}
                icon={faChartArea}
              />
            </div>
            <div className="w-full sm:w-1/3 sm:ml-2 sm:mr-2 mb-4 sm:mb-0">
              <DashboardMetric
                title="New Customers"
                value={data.dashboardData.newCustomers}
                icon={faUserPlus}
              />
            </div>
            <div className="w-full sm:w-1/3 sm:ml-2 mb-4 sm:mb-0">
              <DashboardMetric
                title="Refunds"
                value={formatCurrency(
                  data.dashboardData.refunds
                )}
                icon={faDollarSign}
              />
            </div>
          </div>
          <div className="w-full mt-4">
            <Card>
              {data.dashboardData && (
                <DashboardChart
                  salesData={data.dashboardData.graphData}
                />
              )}
            </Card>
          </div>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </>
  );
};

export default Dashboard;
