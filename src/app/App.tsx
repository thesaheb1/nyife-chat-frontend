import { BrowserRouter } from "react-router-dom";
import Routes from "@/routes/Routes";
import { useInternet } from "@/hooks/use-Internet";
import NoInternet from "@/components/no-internet";

const App = () => {
  const { isOnline, refresh } = useInternet();

  return (
    <BrowserRouter>
      {isOnline ? <Routes /> : <NoInternet refresh={refresh} />}
    </BrowserRouter>
  );
};

export default App;
