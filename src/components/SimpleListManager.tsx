/**
 * ============================================================================
 * SIMPLE REFERENCE LISTS MANAGER
 * ============================================================================
 *
 * Composant minimaliste pour gérer les listes de référence
 *
 * Utilisation: import SimpleListManager from './SimpleListManager'
 */

import { useState } from 'react';
import { useAllReferenceLists } from '@/shared/hooks/useReferenceLists';
import referenceListsService from '@/shared/services/referenceListsService';

export const SimpleListManager = () => {
  const { data, isLoading, error, reload } = useAllReferenceLists({
    realtime: true,
    autoLoad: true,
  });

  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // ============================================================================
  // CRÉER UNE NOUVELLE LISTE
  // ============================================================================

  const handleCreateList = async () => {
    const listKey = prompt('Clé technique de la liste (ex: my_list):');
    if (!listKey) return;

    const listName = prompt('Nom de la liste (ex: Ma Liste):');
    if (!listName) return;

    try {
      setIsCreating(true);
      await referenceListsService.createList('default', 'system', listKey, {
        name: listName,
        description: '',
        allowCustom: true,
        isRequired: false,
        isSystem: false,
      });
      await reload();
      alert('✅ Liste créée !');
    } catch (error: any) {
      alert('❌ Erreur: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // ============================================================================
  // AJOUTER UN ITEM
  // ============================================================================

  const handleAddItem = async (listKey: string) => {
    const value = prompt('Valeur technique (ex: mon_item):');
    if (!value) return;

    const label = prompt('Label affiché (ex: Mon Item):');
    if (!label) return;

    try {
      await referenceListsService.addItem('default', 'system', listKey as any, {
        value,
        label,
        color: 'blue',
        icon: 'Circle',
      });
      await reload();
      alert('✅ Item ajouté !');
    } catch (error: any) {
      alert('❌ Erreur: ' + error.message);
    }
  };

  // ============================================================================
  // MODIFIER UN ITEM
  // ============================================================================

  const handleEditItem = async (listKey: string, itemId: string, currentLabel: string) => {
    const newLabel = prompt('Nouveau label:', currentLabel);
    if (!newLabel || newLabel === currentLabel) return;

    try {
      await referenceListsService.updateItem('default', 'system', listKey as any, {
        itemId,
        label: newLabel,
      });
      await reload();
      alert('✅ Item modifié !');
    } catch (error: any) {
      alert('❌ Erreur: ' + error.message);
    }
  };

  // ============================================================================
  // SUPPRIMER UN ITEM
  // ============================================================================

  const handleDeleteItem = async (listKey: string, itemId: string) => {
    if (!confirm('Supprimer cet item ?')) return;

    try {
      await referenceListsService.deleteItem('default', 'system', listKey as any, itemId);
      await reload();
      alert('✅ Item supprimé !');
    } catch (error: any) {
      alert('❌ Erreur: ' + error.message);
    }
  };

  // ============================================================================
  // SUPPRIMER UNE LISTE
  // ============================================================================

  const handleDeleteList = async (listKey: string) => {
    if (!confirm(`Supprimer la liste "${listKey}" ?`)) return;

    try {
      await referenceListsService.deleteList('default', 'system', listKey);
      await reload();
      setSelectedList(null);
      alert('✅ Liste supprimée !');
    } catch (error: any) {
      alert('❌ Erreur: ' + error.message);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return <div className="p-8 text-center">⏳ Chargement...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">❌ Erreur: {error}</div>;
  }

  if (!data) {
    return <div className="p-8 text-center">Aucune donnée</div>;
  }

  const lists = Object.entries(data.lists);
  const currentList = selectedList ? data.lists[selectedList] : null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">📋 Gestionnaire de Listes</h1>
              <p className="text-gray-600 mt-1">
                {lists.length} liste{lists.length > 1 ? 's' : ''} configurée
                {lists.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={handleCreateList}
              disabled={isCreating}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium disabled:opacity-50"
            >
              ➕ Nouvelle Liste
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LISTE DES LISTES */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-bold mb-4">📚 Listes disponibles</h2>

            {lists.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucune liste</p>
            ) : (
              <div className="space-y-2">
                {lists.map(([key, list]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedList(key)}
                    className={`w-full text-left p-3 rounded border transition ${
                      selectedList === key
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium">{list.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {list.items.length} item{list.items.length > 1 ? 's' : ''}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DÉTAILS DE LA LISTE SÉLECTIONNÉE */}
          <div className="md:col-span-2 bg-white rounded-lg shadow p-4">
            {!currentList ? (
              <div className="text-center text-gray-500 py-12">
                ← Sélectionne une liste pour la gérer
              </div>
            ) : (
              <>
                {/* Header de la liste */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <div>
                    <h2 className="text-xl font-bold">{currentList.name}</h2>
                    {currentList.description && (
                      <p className="text-sm text-gray-600 mt-1">{currentList.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddItem(selectedList!)}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded"
                    >
                      ➕ Ajouter
                    </button>
                    <button
                      onClick={() => handleDeleteList(selectedList!)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>

                {/* Items de la liste */}
                <div className="space-y-2">
                  {currentList.items.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Aucun item. Clique sur "➕ Ajouter" pour en créer un.
                    </p>
                  ) : (
                    currentList.items.map(item => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded border ${
                          item.isActive
                            ? 'bg-white border-gray-200'
                            : 'bg-gray-50 border-gray-200 opacity-50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {item.value}
                            {item.color && ` • ${item.color}`}
                            {item.icon && ` • ${item.icon}`}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditItem(selectedList!, item.id, item.label)}
                            className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteItem(selectedList!, item.id)}
                            className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* INFO */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="font-medium mb-2">💡 Astuce :</p>
          <ul className="space-y-1 text-gray-700">
            <li>• Clique sur une liste pour voir ses items</li>
            <li>• Utilise "➕ Ajouter" pour créer un nouvel item</li>
            <li>• Clique sur ✏️ pour modifier un item</li>
            <li>• Clique sur 🗑️ pour supprimer</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SimpleListManager;
