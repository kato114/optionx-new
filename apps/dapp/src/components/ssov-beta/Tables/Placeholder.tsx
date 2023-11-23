interface Props {
  isLoading: boolean;
}

const Placeholder = ({ isLoading }: Props) => {
  return (
    <div className="flex justify-center my-auto w-full bg-cod-gray  py-8">
      <p className="text-sm text-stieglitz">
        {isLoading ? 'Loading...' : 'Nothing to show'}
      </p>
    </div>
  );
};

export default Placeholder;
