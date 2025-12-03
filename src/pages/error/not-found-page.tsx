import React from 'react';
import { Home, RefreshCw } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-9xl font-extrabold text-blue-500 mb-4 animate-bounce">
          404
        </h1>
        <p className="text-2xl font-semibold text-gray-800 mb-4">
          页面不见了！
        </p>
        <p className="text-gray-600 mb-8">
          看来您访问的页面已经去度假了，暂时无法找到。
        </p>
        
        <div className="flex justify-center space-x-4">
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Home className="mr-2" /> 返回首页
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center bg-gray-100 text-gray-700 px-6 py-3 rounded-full hover:bg-gray-200 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <RefreshCw className="mr-2" /> 刷新页面
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
