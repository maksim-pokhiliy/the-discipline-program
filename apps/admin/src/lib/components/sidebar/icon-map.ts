import ArticleOutlined from "@mui/icons-material/ArticleOutlined";
import ContactMailOutlined from "@mui/icons-material/ContactMailOutlined";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import EventOutlined from "@mui/icons-material/EventOutlined";
import FitnessCenterOutlined from "@mui/icons-material/FitnessCenterOutlined";
import FunctionsOutlined from "@mui/icons-material/FunctionsOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import LabelOutlined from "@mui/icons-material/LabelOutlined";
import PeopleOutlined from "@mui/icons-material/PeopleOutlined";
import StarBorderOutlined from "@mui/icons-material/StarBorderOutlined";
import TranslateOutlined from "@mui/icons-material/TranslateOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import ViewModuleOutlined from "@mui/icons-material/ViewModuleOutlined";
import WebOutlined from "@mui/icons-material/WebOutlined";

const icons = {
  dashboard: DashboardOutlined,
  products: Inventory2Outlined,
  reviews: StarBorderOutlined,
  blog: ArticleOutlined,
  pages: WebOutlined,
  languages: TranslateOutlined,
  contacts: ContactMailOutlined,
  exercises: FitnessCenterOutlined,
  labels: LabelOutlined,
  profileAxes: TuneOutlined,
  blockTypes: ViewModuleOutlined,
  schemeTypes: FunctionsOutlined,
  dayTypes: EventOutlined,
  users: PeopleOutlined,
} as const;

type NavIconName = keyof typeof icons;

const isNavIconName = (name: string): name is NavIconName => name in icons;

export const getNavIcon = (name: string) => {
  if (isNavIconName(name)) {
    return icons[name];
  }

  return DashboardOutlined;
};
