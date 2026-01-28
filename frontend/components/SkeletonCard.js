export default function SkeletonCard(){
  return (
    <div className="animate-pulse bg-gray-800/40 border border-gray-700 rounded-lg p-4 flex flex-col gap-3">
      <div className="h-40 bg-gray-700 rounded" />
      <div className="h-4 bg-gray-700 rounded w-3/4" />
      <div className="h-3 bg-gray-700 rounded w-1/2" />
      <div className="mt-auto flex gap-2">
        <div className="h-5 bg-gray-700 rounded w-14" />
        <div className="h-5 bg-gray-700 rounded w-10" />
      </div>
    </div>
  );
}
