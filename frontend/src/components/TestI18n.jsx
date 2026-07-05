import { useTranslation } from 'react-i18next';

export default function TestI18n() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="p-4 border-2 border-blue-500 m-4 rounded-lg bg-blue-50/10">
      <h3 className="text-xl font-bold mb-2">i18n Test Component</h3>
      <p className="mb-4">Current Language: <span className="font-semibold">{i18n.language}</span></p>
      
      <p className="mb-4 text-lg">
        Translation of "appName": <span className="text-blue-500 font-bold">{t('appName')}</span>
      </p>

      <div className="flex gap-2">
        <button 
          onClick={() => changeLanguage('en')}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-black"
        >
          English
        </button>
        <button 
          onClick={() => changeLanguage('hi')}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-black"
        >
          हिंदी (Hindi)
        </button>
        <button 
          onClick={() => changeLanguage('mr')}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-black"
        >
          मराठी (Marathi)
        </button>
      </div>
    </div>
  );
}
