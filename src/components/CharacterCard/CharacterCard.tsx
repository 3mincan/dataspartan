import type { ReactNode } from 'react';
import type { CharacterDetails, OrganicDetails, RobotDetails } from '../../api/types';
import type { AsyncResult } from '../../hooks/useAsync';
import { formatValue } from '../../utils/character';
import { ErrorMessage } from '../ui/ErrorMessage/ErrorMessage';
import { Spinner } from '../ui/Spinner/Spinner';
import styles from './CharacterCard.module.css';

interface CharacterCardProps {
  /** Known from the cast list, so the heading shows before details load. */
  name: string;
  details: AsyncResult<CharacterDetails>;
}

export function CharacterCard({ name, details }: CharacterCardProps) {
  let body: ReactNode;
  switch (details.status) {
    case 'idle':
    case 'loading':
      body = (
        <div aria-busy="true">
          <Spinner label={`Loading details for ${name}`} />
        </div>
      );
      break;
    case 'error':
      body = (
        <ErrorMessage
          message={`Details for ${name} could not be loaded.`}
          onRetry={details.retry}
        />
      );
      break;
    case 'success':
      body =
        details.data.kind === 'robot' ? (
          <RobotFacts robot={details.data} />
        ) : (
          <OrganicFacts organic={details.data} />
        );
      break;
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.name}>{name}</h2>
      {body}
    </div>
  );
}

function RobotFacts({ robot }: { robot: RobotDetails }) {
  return (
    <>
      {/* Icon plus visible text: the mark never depends on the image alone. */}
      <p className={`label ${styles.robotMark}`}>
        <RobotIcon />
        Artificial being
      </p>
      <dl className={styles.facts}>
        <Fact label="Height" value={formatValue(robot.height, 'cm')} />
        <Fact label="Mass" value={formatValue(robot.mass, 'kg')} />
        <Fact label="Manufacturing year" value={formatValue(robot.manufacturingYear)} />
      </dl>
    </>
  );
}

function OrganicFacts({ organic }: { organic: OrganicDetails }) {
  return (
    <dl className={styles.facts}>
      <Fact label="Species" value={formatValue(organic.speciesName)} />
      <Fact label="Classification" value={formatValue(organic.speciesClassification)} />
      <Fact label="Homeworld" value={formatValue(organic.homeworldName)} />
      <Fact label="Height" value={formatValue(organic.height, 'cm')} />
      <Fact label="Birth year" value={formatValue(organic.birthYear)} />
    </dl>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.fact}>
      <dt className="label">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** Decorative: the adjacent text carries the meaning. */
function RobotIcon() {
  return (
    <svg
      aria-hidden="true"
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M12 4v4M9 13v1M15 13v1M9 17h6" />
      <circle cx="12" cy="3" r="1" />
    </svg>
  );
}
