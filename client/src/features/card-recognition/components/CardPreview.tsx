/**
 * CardPreview Component
 *
 * Displays recognized card with details and alternatives
 */

import { X, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CardData } from "../types/card-recognition.types";

interface CardPreviewProps {
  card: CardData;
  confidence: number;
  alternatives?: CardData[];
  onClose: () => void;
  onSelectAlternative?: (card: CardData) => void;
}

export function CardPreview({
  card,
  confidence,
  alternatives = [],
  onClose,
  onSelectAlternative,
}: CardPreviewProps) {
  const confidenceColor =
    confidence > 0.7
      ? "bg-green-500"
      : confidence > 0.4
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <Card className="fixed top-4 right-4 w-96 max-h-[90vh] shadow-2xl z-50 bg-white dark:bg-gray-900">
      <CardHeader className="relative">
        <CardTitle className="pr-8">Recognized Card</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <ScrollArea className="max-h-[70vh]">
          {/* Main Card Display */}
          <div className="space-y-4">
            {/* Card Image */}
            {card.imageUrl && (
              <div className="relative">
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-full rounded-lg shadow-md"
                  loading="lazy"
                />
              </div>
            )}

            {/* Card Details */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-bold">{card.name}</h3>
                <Badge className={`${confidenceColor} text-white`}>
                  {Math.round(confidence * 100)}%
                </Badge>
              </div>

              {card.manaCost && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Mana Cost:</strong> {card.manaCost}
                </p>
              )}

              {card.type && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Type:</strong> {card.type}
                </p>
              )}

              {card.oracleText && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Text:</strong>
                  <p className="mt-1 whitespace-pre-wrap">{card.oracleText}</p>
                </div>
              )}

              {(card.power || card.toughness) && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>P/T:</strong> {card.power}/{card.toughness}
                </p>
              )}

              {card.set && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Set:</strong> {card.set}{" "}
                  {card.collectorNumber && `#${card.collectorNumber}`}
                </p>
              )}

              {card.rarity && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Rarity:</strong> {card.rarity}
                </p>
              )}

              {card.artist && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Artist:</strong> {card.artist}
                </p>
              )}
            </div>

            {/* Alternatives */}
            {alternatives.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Alternative Matches:
                </h4>
                <div className="space-y-2">
                  {alternatives.map((altCard) => (
                    <button
                      key={altCard.id}
                      onClick={() => onSelectAlternative?.(altCard)}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {altCard.imageUrl && (
                          <img
                            src={altCard.imageUrl}
                            alt={altCard.name}
                            className="w-12 h-16 object-cover rounded"
                            loading="lazy"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {altCard.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {altCard.set}{" "}
                            {altCard.collectorNumber &&
                              `#${altCard.collectorNumber}`}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* External Link */}
            {card.gameType === "mtg" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  window.open(`https://scryfall.com/card/${card.id}`, "_blank")
                }
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Scryfall
              </Button>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
