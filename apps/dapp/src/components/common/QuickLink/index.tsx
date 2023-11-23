import LaunchIcon from '@mui/icons-material/Launch';

const QuickLink = ({ text, href }: { text: string; href: string }) => {
  return (
    <a href={href} rel="noopener noreferrer">
      <div className="bg-umbra p-3  flex justify-between text-xs items-center">
        {text}
        <LaunchIcon className="w-4" />
      </div>
    </a>
  );
};

export default QuickLink;
