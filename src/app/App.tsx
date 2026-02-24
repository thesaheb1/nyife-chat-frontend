import { BrowserRouter } from "react-router-dom";
import Routes from "@/routes/Routes";
import { useInternet } from "@/hooks/use-Internet";
import NoInternet from "@/components/no-internet";
import GlobalConfirmationDialog from "@/components/globalConfirmationDialog/GlobalConfirmationDialog";
import { closeConfirmation } from "@/redux/slices/confirmationSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";

const App = () => {
  const { isOnline, refresh } = useInternet();
  const dispatch = useAppDispatch();
  const confirmation = useAppSelector((state) => state.confirmation);

  return (
    <BrowserRouter>
      {isOnline ? <Routes /> : <NoInternet refresh={refresh} />}
      <GlobalConfirmationDialog
        open={confirmation.open}
        actionType={confirmation.actionType === "delete" || confirmation.actionType === "update" || confirmation.actionType === "add"
          ? confirmation.actionType
          : undefined}
        callbackFunction={confirmation.callbackFunction ?? undefined}
        customText={confirmation.customText ?? undefined}
        onClose={() => dispatch(closeConfirmation())}
      />
    </BrowserRouter>
  );
};

export default App;
