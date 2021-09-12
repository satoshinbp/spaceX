import { useState } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, useQuery, gql } from '@apollo/client';
import { format } from 'date-fns';
import './App.css';

const client = new ApolloClient({
  uri: 'https://api.spacex.land/graphql/',
  cache: new InMemoryCache(),
});

const GET_COMPANY = gql`
  query {
    company {
      numberOfEmployees: employees
      ceo
      foundedYear: founded
      headquarters {
        city
        state
      }
      name
      summary
    }
  }
`;

const Company = () => {
  const { loading, error, data } = useQuery(GET_COMPANY);

  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  return (
    <>
      <h1>{data.company.name} 🚀</h1>
      <p>{data.company.summary}</p>
      <p>CEO: {data.company.ceo}</p>
      <p>Founded in {data.company.foundedYear}</p>
      <p>Number of Employees: {data.company.numberOfEmployees}</p>
      <p>
        Headquarters: {data.company.headquarters.city}, {data.company.headquarters.state}
      </p>
    </>
  );
};

const ROCKET_INFO = gql`
  fragment rocketInfo on Rocket {
    name
    description
  }
`;

const GET_LAUNCHESPAST = gql`
  ${ROCKET_INFO}
  query ($limit: Int!) {
    launchesPast(limit: $limit) {
      id
      missionName: mission_name
      launchDate: launch_date_local
      launchSite: launch_site {
        siteName: site_name_long
      }
      links {
        article: article_link
        video: video_link
        images: flickr_images
      }
      rocket {
        rocket {
          ...rocketInfo
        }
      }
    }
  }
`;

const LaunchesPast = ({ limit }) => {
  const { loading, error, data } = useQuery(GET_LAUNCHESPAST, {
    variables: { limit },
  });

  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  return (
    <div className="container">
      {data.launchesPast.map((launch) => (
        <div className="card mission-card" key={launch.id}>
          <div className="wrapper">
            <h3>{launch.missionName}</h3>
            <div className="img-container">
              {launch.links.images.length > 0 ? (
                <img src={launch.links.images[Math.floor(Math.random() * launch.links.images.length)]} alt="" />
              ) : (
                <img src={null} alt="Not Found" />
              )}
            </div>
            <p>Date: {format(new Date(launch.launchDate), 'yyyy/MM/dd')}</p>
            <p>Site: {launch.launchSite.siteName}</p>
            <p>Rocket: {launch.rocket.rocket.name}</p>
            <p>
              Links:&nbsp;
              {launch.links.article && <a href={launch.links.article}>Article</a>},&nbsp;
              {launch.links.video && <a href={launch.links.video}>Video</a>}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

const ROCKET_SPEC = gql`
  fragment rocketSpec on Rocket {
    firstStage: first_stage {
      burnTime: burn_time_sec
      fuelAmount: fuel_amount_tons
      thrustSeaLevel: thrust_sea_level {
        kN
      }
      thrustVacuum: thrust_vacuum {
        kN
      }
    }
    secondStage: second_stage {
      burnTime: burn_time_sec
      fuelAmount: fuel_amount_tons
      payloads {
        fairing: composite_fairing {
          diameter {
            meters
          }
          height {
            meters
          }
        }
      }
      thrust {
        kN
      }
    }
  }
`;

const GET_ROCKETS = gql`
  ${ROCKET_INFO}
  ${ROCKET_SPEC}
  query {
    rockets {
      ...rocketInfo
      ...rocketSpec
    }
  }
`;

const Rockets = () => {
  const { loading, error, data } = useQuery(GET_ROCKETS);

  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  return (
    <div className="container">
      {data.rockets.map((rocket) => (
        <div className="card rocket-card">
          <div className="wrapper">
            <h3>{rocket.name}</h3>
            <p>{rocket.description}</p>
            <h4>First Stage</h4>
            <p>Burn Time: {rocket.firstStage.burnTime}s</p>
            <p>Fuel Amount: {rocket.firstStage.fuelAmount}kg</p>
            <p>Thrust (Sea Level): {rocket.firstStage.thrustSeaLevel.kN}kN</p>
            <p>Thrust (Vacuum): {rocket.firstStage.thrustVacuum.kN}kN</p>
            <h4>Second Stage</h4>
            <p>Burn Time: {rocket.secondStage.burnTime}s</p>
            <p>Fuel Amount: {rocket.secondStage.fuelAmount}kg</p>
            <p>Thrust: {rocket.secondStage.thrust.kN}kN</p>
            <p>
              Payload Fairing: (D){rocket.secondStage.payloads.fairing.diameter.meters}m x&nbsp; (H)
              {rocket.secondStage.payloads.fairing.height.meters}m
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

const App = () => {
  const [missionsToDisplay, setMissionsToDisplay] = useState(12);

  const handleChange = (e) => setMissionsToDisplay(parseInt(e.target.value));

  return (
    <div className="wrapper">
      <ApolloProvider client={client}>
        <Company />
        <h2>Past Missions</h2>
        Display <input type="number" value={missionsToDisplay} onChange={handleChange} />
        <LaunchesPast limit={missionsToDisplay} />
        <h2>Rockets</h2>
        <Rockets />
      </ApolloProvider>
    </div>
  );
};

export default App;
