const ContentModeration = () => {
  const flaggedContent = [
    {
      id: 1,
      title: "Investment Tips 101",
      type: "Article",
      flaggedBy: "User123",
    },
    {
      id: 2,
      title: "Community Post: Funding Help",
      type: "Post",
      flaggedBy: "User456",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl text-gold font-bold mb-6">Content Moderation</h1>
      {flaggedContent.length === 0 ? (
        <p>No flagged content at this time. 🎉</p>
      ) : (
        <ul className="space-y-4">
          {flaggedContent.map((content) => (
            <li key={content.id} className="bg-gray-800 p-4 rounded">
              <p>
                <strong>{content.title}</strong> ({content.type})
              </p>
              <p className="text-sm text-gray-400">
                Flagged by: {content.flaggedBy}
              </p>
              <div className="mt-2">
                <button className="bg-green-600 px-3 py-1 rounded mr-2">
                  Approve
                </button>
                <button className="bg-red-600 px-3 py-1 rounded">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ContentModeration;
