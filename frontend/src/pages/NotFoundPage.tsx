import { Link } from "react-router-dom";
import Panel from "../components/ui/Panel";

const NotFoundPage = () => {
  return (
    <section className="flex min-h-[70vh] items-center justify-center">
      <Panel
        className="max-w-2xl"
        eyebrow="404"
        title="This page wandered off."
        description="The route does not exist in Xeno Copilot. Head back to the main workspace and keep building the campaign."
        actions={
          <Link
            to="/copilot"
            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(25,168,152,0.24)] transition-all duration-200 hover:translate-y-[-1px]"
          >
            Back to copilot
          </Link>
        }
      >
        <p className="text-sm leading-6 text-[var(--text-muted)]">
          Everything important lives in the copilot, customers, campaigns, and timeline screens.
        </p>
      </Panel>
    </section>
  );
};

export default NotFoundPage;
