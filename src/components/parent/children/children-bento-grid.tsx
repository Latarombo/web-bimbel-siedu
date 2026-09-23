'use client';

import { useState } from 'react';
import { ChildData } from './types';
import { ChildBentoCard } from './child-bento-card';
import { AddChildBentoTile } from './add-child-bento-tile';
import { ChildQuickViewModal } from './child-quick-view-modal';

interface ChildrenBentoGridProps {
  childrenList: ChildData[];
}

export function ChildrenBentoGrid({ childrenList }: ChildrenBentoGridProps) {
  const [selectedChild, setSelectedChild] = useState<ChildData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectChild = (child: ChildData) => {
    setSelectedChild(child);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Tile Tambah Profil Anak di Awal (Atas) Barisan Grid */}
        <AddChildBentoTile />

        {childrenList.map((child) => (
          <ChildBentoCard
            key={child.id}
            child={child}
            onSelect={handleSelectChild}
          />
        ))}
      </div>

      {/* Modal Quick View Detail Anak */}
      <ChildQuickViewModal
        child={selectedChild}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
