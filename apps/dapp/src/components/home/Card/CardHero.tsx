interface CardHeroProps {
  name: string;
  description: string;
  apy: number;
}

const CardHero = ({ name, description, apy }: CardHeroProps) => {
  return (
    <div className="flex w-full justify-between">
      <div className="flex flex-col items-start">
        <div className="font-bold xs:text-lg">{name}</div>
        <div className="xs:text-sm text-xs text-stieglitz">{description}</div>
      </div>
      <div className="text-sm">
        up to{' '}
        <span className="text-up-only xs:text-xl text-lg font-bold">
          {apy.toFixed(0)}% APY
        </span>
      </div>
    </div>
  );
};

export default CardHero;
