import { usePageContext } from "vike-react/usePageContext";

export function Page() {
  const { is404 } = usePageContext();

  if (is404) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-24 text-center">
        <p className="text-6xl font-bold text-gray-200 dark:text-gray-800 mb-4">
          404
        </p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Post not found
        </h1>
        <p className="text-gray-500 dark:text-gray-500 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          Back to home
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-24 text-center">
      <p className="text-6xl font-bold text-gray-200 dark:text-gray-800 mb-4">
        500
      </p>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Something went wrong
      </h1>
      <p className="text-gray-500 dark:text-gray-500 mb-8">
        An unexpected error occurred.
      </p>
      <a
        href="/"
        className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
      >
        Back to home
      </a>
    </div>
  );
}
