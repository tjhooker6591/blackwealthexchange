// src/components/ClientTime.tsx
import React from "react";

interface ClientTimeProps {
  date: Date;
}

const ClientTime: React.FC<ClientTimeProps> = ({ date }) => {
  return <span>{date.toLocaleString()}</span>;
};

export default ClientTime;
